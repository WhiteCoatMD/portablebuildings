/**
 * Google Business Profile OAuth callback handler
 * Exchanges authorization code for tokens and stores connection
 */

const { getPool } = require('../../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    try {
        const { code, error, state } = req.query;

        // Handle OAuth errors
        if (error) {
            console.error('[GBP OAuth Callback] Error:', error);
            return res.redirect(`/admin.html?gbp_error=${encodeURIComponent(error)}`);
        }

        if (!code) {
            return res.redirect('/admin.html?gbp_error=missing_code');
        }

        const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
        const redirectUri = 'https://portablebuildings.vercel.app/api/auth/google-business/callback';

        if (!clientId || !clientSecret) {
            console.error('[GBP OAuth Callback] Missing credentials');
            return res.redirect('/admin.html?gbp_error=missing_credentials');
        }

        // Exchange authorization code for tokens
        console.log('[GBP OAuth Callback] Exchanging code for tokens...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[GBP OAuth Callback] Token exchange failed:', errorText);
            return res.redirect('/admin.html?gbp_error=token_exchange_failed');
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, expires_in } = tokens;

        if (!access_token) {
            console.error('[GBP OAuth Callback] No access token received');
            return res.redirect('/admin.html?gbp_error=no_access_token');
        }

        // Calculate token expiration
        const expiresAt = new Date(Date.now() + (expires_in * 1000));

        // Fetch account and location information
        console.log('[GBP OAuth Callback] Fetching accounts...');
        const accountsResponse = await fetch(
            'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            }
        );

        if (!accountsResponse.ok) {
            const errorText = await accountsResponse.text();
            console.error('[GBP OAuth Callback] Failed to fetch accounts:', errorText);
            return res.redirect('/admin.html?gbp_error=failed_to_fetch_accounts');
        }

        const accountsData = await accountsResponse.json();
        const accounts = accountsData.accounts || [];

        if (accounts.length === 0) {
            console.error('[GBP OAuth Callback] No accounts found');
            return res.redirect('/admin.html?gbp_error=no_accounts_found');
        }

        // Use the first account
        const account = accounts[0];
        const accountId = account.name; // Format: accounts/{account_id}
        const accountName = account.accountName || 'Unknown';

        // Fetch locations for this account
        console.log('[GBP OAuth Callback] Fetching locations...');
        const locationsResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            }
        );

        let locationId = null;
        let locationName = null;
        let locationAddress = null;

        if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            const locations = locationsData.locations || [];

            if (locations.length > 0) {
                const location = locations[0]; // Use first location
                locationId = location.name; // Format: locations/{location_id}
                locationName = location.title || location.locationName || 'Unknown';

                // Build address string
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
        }

        // Get userId from session or state parameter
        // For now, we'll need to pass userId through the OAuth flow
        // TODO: Implement proper session management or state parameter
        const userId = state ? parseInt(state) : null;

        if (!userId) {
            console.error('[GBP OAuth Callback] No userId found');
            return res.redirect('/admin.html?gbp_error=no_user_id');
        }

        // Store connection in database
        console.log('[GBP OAuth Callback] Storing connection in database...');

        try {
            await pool.query(
                `INSERT INTO google_business_connections
                 (user_id, access_token, refresh_token, token_expires_at,
                  account_id, account_name, location_id, location_name, location_address)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (user_id)
                 DO UPDATE SET
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    token_expires_at = EXCLUDED.token_expires_at,
                    account_id = EXCLUDED.account_id,
                    account_name = EXCLUDED.account_name,
                    location_id = EXCLUDED.location_id,
                    location_name = EXCLUDED.location_name,
                    location_address = EXCLUDED.location_address,
                    is_active = true,
                    updated_at = NOW()`,
                [
                    userId,
                    access_token,
                    refresh_token,
                    expiresAt,
                    accountId,
                    accountName,
                    locationId,
                    locationName,
                    locationAddress,
                ]
            );

            console.log('[GBP OAuth Callback] Connection stored successfully');
            return res.redirect('/admin.html?gbp_success=true');

        } catch (dbError) {
            console.error('[GBP OAuth Callback] Database error:', dbError);
            console.error('Error details:', dbError.message);
            // Still redirect to success since OAuth completed, just log the DB issue
            return res.redirect('/admin.html?gbp_success=true&db_warning=true');
        }

    } catch (error) {
        console.error('[GBP OAuth Callback] Unexpected error:', error);
        console.error('Error stack:', error.stack);
        return res.redirect(`/admin.html?gbp_error=${encodeURIComponent('unexpected_error')}`);
    }
};
