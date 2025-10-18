/**
 * Refresh Google Business Profile account and location information
 * Used when initial OAuth connection didn't fetch account details
 */

const { getPool } = require('../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        // Get existing connection
        const result = await pool.query(
            `SELECT access_token, account_id, location_id
             FROM google_business_connections
             WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No active Google Business Profile connection found'
            });
        }

        const connection = result.rows[0];
        const accessToken = connection.access_token;

        let accountId = connection.account_id;
        let accountName = null;
        let locationId = connection.location_id;
        let locationName = null;
        let locationAddress = null;

        // If account info is missing, fetch it
        if (!accountId) {
            console.log('[GBP Refresh] Fetching accounts...');
            const accountsResponse = await fetch(
                'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!accountsResponse.ok) {
                const errorText = await accountsResponse.text();
                console.error('[GBP Refresh] Failed to fetch accounts:', accountsResponse.status, errorText);
                return res.status(400).json({
                    success: false,
                    error: 'Failed to fetch Google Business accounts',
                    details: errorText
                });
            }

            const accountsData = await accountsResponse.json();
            const accounts = accountsData.accounts || [];

            if (accounts.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No Google Business accounts found'
                });
            }

            const account = accounts[0];
            accountId = account.name;
            accountName = account.accountName || 'Unknown';
        }

        // Fetch location info if missing or if we just got account info
        if (!locationId || !accountId) {
            console.log('[GBP Refresh] Fetching locations...');
            const locationsResponse = await fetch(
                `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (locationsResponse.ok) {
                const locationsData = await locationsResponse.json();
                const locations = locationsData.locations || [];

                if (locations.length > 0) {
                    const location = locations[0];
                    locationId = location.name;
                    locationName = location.title || location.locationName || 'Unknown';

                    if (location.storefrontAddress) {
                        const addr = location.storefrontAddress;
                        const parts = [
                            addr.addressLines?.join(', '),
                            addr.locality,
                            addr.administrativeArea,
                            addr.postalCode,
                        ].filter(Boolean);
                        locationAddress = parts.join(', ');
                    }
                }
            } else {
                console.warn('[GBP Refresh] Failed to fetch locations:', locationsResponse.status);
            }
        }

        // Update database with fetched info
        await pool.query(
            `UPDATE google_business_connections
             SET account_id = $1,
                 account_name = $2,
                 location_id = $3,
                 location_name = $4,
                 location_address = $5,
                 updated_at = NOW()
             WHERE user_id = $6`,
            [accountId, accountName, locationId, locationName, locationAddress, userId]
        );

        console.log('[GBP Refresh] Account info updated successfully');

        return res.status(200).json({
            success: true,
            message: 'Account information updated',
            connection: {
                accountName,
                locationName,
                locationAddress
            }
        });

    } catch (error) {
        console.error('[GBP Refresh] Error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to refresh account information'
        });
    }
};
