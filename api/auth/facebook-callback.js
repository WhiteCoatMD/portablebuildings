/**
 * Facebook OAuth - Callback Handler
 * Handles the callback from Facebook after user authorization
 */
const { getPool } = require('../../lib/db');
const axios = require('axios');

const pool = getPool();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'https://shed-sync.com/api/auth/facebook-callback';

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { code, state, error, error_description } = req.query;

        // Check if user denied permission
        if (error) {
            console.log('[FB OAuth] User denied permission:', error_description);
            return res.redirect(`/admin.html?tab=customization&fb_error=${encodeURIComponent(error_description || 'Permission denied')}`);
        }

        if (!code || !state) {
            return res.status(400).json({
                success: false,
                error: 'Missing authorization code or state'
            });
        }

        // Verify state and extract user ID
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const userId = stateData.userId;

        console.log('[FB OAuth] Processing callback for user:', userId);

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code: code
            }
        });

        const userAccessToken = tokenResponse.data.access_token;

        // Get user's pages (returns page tokens with posting permissions)
        const pagesResponse = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
            params: {
                access_token: userAccessToken
            }
        });

        const pages = pagesResponse.data.data;

        if (!pages || pages.length === 0) {
            console.log('[FB OAuth] No pages found for user');
            return res.redirect('/admin.html?tab=customization&fb_error=No Facebook pages found. Please create a Facebook page first.');
        }

        // Use the first page (or let user select if multiple)
        const firstPage = pages[0];
        const pageAccessToken = firstPage.access_token;
        const pageId = firstPage.id;
        const pageName = firstPage.name;

        console.log('[FB OAuth] Found page:', pageName, 'ID:', pageId);

        // Exchange for long-lived token (60 days)
        const longLivedTokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                fb_exchange_token: pageAccessToken
            }
        });

        const longLivedToken = longLivedTokenResponse.data.access_token;

        // Create Facebook config object
        const fbConfig = {
            enabled: false, // User needs to enable it manually
            pageId: pageId,
            accessToken: longLivedToken,
            pageName: pageName,
            conditions: {
                newOnly: true,
                withImages: true,
                availableOnly: true
            },
            template: `🏠 New Arrival! {{name}}\n\n📐 Size: {{size}}\n💰 Cash Price: {{price}}\n📍 Location: {{location}}\n\nCall us at {{phone}} or visit our website to learn more!\n\n#PortableBuildings #{{type}} #ForSale`
        };

        // Store in database as cpb_facebook_config
        await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value)
             VALUES ($1, 'cpb_facebook_config', $2)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [userId, JSON.stringify(fbConfig)]
        );

        // Also save page name separately for display
        await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value)
             VALUES ($1, 'cpb_facebook_page_name', $2)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [userId, JSON.stringify(pageName)]
        );

        // Also save page ID separately for display
        await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value)
             VALUES ($1, 'cpb_facebook_page_id', $2)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [userId, JSON.stringify(pageId)]
        );

        console.log('[FB OAuth] Successfully connected Facebook page:', pageName);

        // Return HTML that closes popup and notifies parent
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Facebook Connected</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        color: white;
                    }
                    .container {
                        text-align: center;
                    }
                    .success {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        margin: 0 0 0.5rem 0;
                        color: #ffd60a;
                    }
                    p {
                        margin: 0;
                        opacity: 0.8;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success">✅</div>
                    <h1>Facebook Connected!</h1>
                    <p>Connected to: ${pageName}</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem;">This window will close automatically...</p>
                </div>
                <script>
                    // Notify parent window
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'facebook_connected',
                            pageName: '${pageName}',
                            pageId: '${pageId}'
                        }, '*');
                    }
                    // Close popup after 2 seconds
                    setTimeout(() => window.close(), 2000);
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('[FB OAuth] Error in callback:', error);

        res.redirect(`/admin.html?tab=customization&fb_error=${encodeURIComponent('Failed to connect Facebook. Please try again.')}`);
    }
};
