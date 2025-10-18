/**
 * List all available Google Business Profile locations for the connected account
 */

const { getPool } = require('../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        // Get connection
        const result = await pool.query(
            `SELECT access_token, account_id
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

        // If account ID is missing, fetch it first
        if (!accountId) {
            const accountsResponse = await fetch(
                'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!accountsResponse.ok) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to fetch Google Business accounts'
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

            accountId = accounts[0].name;
        }

        // Fetch all locations
        const locationsResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!locationsResponse.ok) {
            const errorText = await locationsResponse.text();
            return res.status(400).json({
                success: false,
                error: 'Failed to fetch locations',
                details: errorText
            });
        }

        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];

        const formattedLocations = locations.map(loc => {
            let address = null;
            if (loc.storefrontAddress) {
                const addr = loc.storefrontAddress;
                const parts = [
                    addr.addressLines?.join(', '),
                    addr.locality,
                    addr.administrativeArea,
                    addr.postalCode,
                ].filter(Boolean);
                address = parts.join(', ');
            }

            return {
                id: loc.name,
                name: loc.title || loc.locationName || 'Unnamed Location',
                address: address,
                phoneNumber: loc.phoneNumbers?.primaryPhone || null,
                websiteUrl: loc.websiteUri || null
            };
        });

        return res.status(200).json({
            success: true,
            locations: formattedLocations,
            count: formattedLocations.length
        });

    } catch (error) {
        console.error('[GBP List Locations] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch locations'
        });
    }
};
