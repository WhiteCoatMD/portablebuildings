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
            return res.redirect(`/oauth-callback.html?gbp_error=${encodeURIComponent(error)}`);
        }

        if (!code) {
            return res.redirect('/oauth-callback.html?gbp_error=missing_code');
        }

        const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim();
        const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim();
        const redirectUri = 'https://portablebuildings.vercel.app/api/auth/google-business/callback';

        if (!clientId || !clientSecret) {
            console.error('[GBP OAuth Callback] Missing credentials');
            return res.redirect('/oauth-callback.html?gbp_error=missing_credentials');
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
            return res.redirect('/oauth-callback.html?gbp_error=token_exchange_failed');
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, expires_in } = tokens;

        if (!access_token) {
            console.error('[GBP OAuth Callback] No access token received');
            return res.redirect('/oauth-callback.html?gbp_error=no_access_token');
        }

        // Calculate token expiration
        const expiresAt = new Date(Date.now() + (expires_in * 1000));

        // Get userId from state parameter
        const userId = state ? parseInt(state) : null;

        if (!userId) {
            console.error('[GBP OAuth Callback] No userId found');
            return res.redirect('/oauth-callback.html?gbp_error=no_user_id');
        }

        // Initialize account/location variables
        let accountId = null;
        let accountName = null;
        let locationId = null;
        let locationName = null;
        let locationAddress = null;

        // Try to fetch account and location information
        // If rate limited, we'll save the connection anyway and fetch later
        try {
            console.log('[GBP OAuth Callback] Fetching accounts...');
            const accountsResponse = await fetch(
                'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                    },
                }
            );

            if (accountsResponse.ok) {
                const accountsData = await accountsResponse.json();
                const accounts = accountsData.accounts || [];

                if (accounts.length > 0) {
                    // Use the first account
                    const account = accounts[0];
                    accountId = account.name; // Format: accounts/{account_id}
                    accountName = account.accountName || 'Unknown';

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
                }
            } else if (accountsResponse.status === 429) {
                console.warn('[GBP OAuth Callback] Rate limited - will fetch account info later');
                // Continue anyway - we'll fetch account info later
            } else {
                console.warn('[GBP OAuth Callback] Failed to fetch accounts:', accountsResponse.status);
                // Continue anyway - we'll fetch account info later
            }
        } catch (fetchError) {
            console.warn('[GBP OAuth Callback] Error fetching account info:', fetchError.message);
            // Continue anyway - we have the tokens, we can fetch account info later
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
            return res.redirect('/oauth-callback.html?gbp_success=true');

        } catch (dbError) {
            console.error('[GBP OAuth Callback] Database error:', dbError);
            console.error('Error details:', dbError.message);
            // Still redirect to success since OAuth completed, just log the DB issue
            return res.redirect('/oauth-callback.html?gbp_success=true&db_warning=true');
        }

    } catch (error) {
        console.error('[GBP OAuth Callback] Unexpected error:', error);
        console.error('Error stack:', error.stack);
        return res.redirect(`/oauth-callback.html?gbp_error=${encodeURIComponent('unexpected_error')}`);
    }
};
