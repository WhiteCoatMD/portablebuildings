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
        const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code: code
            }
        });

        const userAccessToken = tokenResponse.data.access_token;

        // Get user's pages
        const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
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
        const longLivedTokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                fb_exchange_token: pageAccessToken
            }
        });

        const longLivedToken = longLivedTokenResponse.data.access_token;

        // Store in database
        await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value)
             VALUES ($1, 'cpb_facebook_page_id', $2)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [userId, JSON.stringify(pageId)]
        );

        await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value)
             VALUES ($1, 'cpb_facebook_access_token', $2)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [userId, JSON.stringify(longLivedToken)]
        );

        await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value)
             VALUES ($1, 'cpb_facebook_page_name', $2)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [userId, JSON.stringify(pageName)]
        );

        console.log('[FB OAuth] Successfully connected Facebook page:', pageName);

        // Redirect back to admin with success message
        res.redirect(`/admin.html?tab=customization&fb_success=true&page_name=${encodeURIComponent(pageName)}`);

    } catch (error) {
        console.error('[FB OAuth] Error in callback:', error);

        res.redirect(`/admin.html?tab=customization&fb_error=${encodeURIComponent('Failed to connect Facebook. Please try again.')}`);
    }
};
