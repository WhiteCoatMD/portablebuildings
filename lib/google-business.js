/**
 * Google Business Profile API helper functions
 */

const { getPool } = require('./db');

const pool = getPool();

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(userId) {
    try {
        console.log(`[GBP] Refreshing access token for user ${userId}...`);

        // Get current connection
        const result = await pool.query(
            `SELECT refresh_token FROM google_business_connections
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new Error('No GBP connection found');
        }

        const { refresh_token } = result.rows[0];

        if (!refresh_token) {
            throw new Error('No refresh token available');
        }

        const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Google Business Profile credentials not configured');
        }

        // Request new access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GBP] Token refresh failed:', errorText);
            throw new Error('Failed to refresh token');
        }

        const tokens = await response.json();
        const { access_token, expires_in } = tokens;

        if (!access_token) {
            throw new Error('No access token in refresh response');
        }

        // Calculate new expiration
        const expiresAt = new Date(Date.now() + (expires_in * 1000));

        // Update database
        await pool.query(
            `UPDATE google_business_connections
             SET access_token = $1,
                 token_expires_at = $2,
                 updated_at = NOW()
             WHERE user_id = $3`,
            [access_token, expiresAt, userId]
        );

        console.log(`[GBP] Access token refreshed for user ${userId}`);
        return access_token;

    } catch (error) {
        console.error('[GBP] Error refreshing token:', error);
        throw error;
    }
}

/**
 * Get valid access token (refreshing if needed)
 */
async function getValidAccessToken(userId) {
    try {
        // Get current connection
        const result = await pool.query(
            `SELECT access_token, token_expires_at, refresh_token
             FROM google_business_connections
             WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new Error('No active GBP connection found');
        }

        const { access_token, token_expires_at, refresh_token } = result.rows[0];

        // Check if token is expired or about to expire (within 5 minutes)
        const expiresAt = new Date(token_expires_at);
        const now = new Date();
        const expiresIn = Math.floor((expiresAt - now) / 1000); // seconds

        if (expiresIn < 300) {
            console.log('[GBP] Token expired or expiring soon, refreshing...');
            return await refreshAccessToken(userId);
        }

        return access_token;

    } catch (error) {
        console.error('[GBP] Error getting valid token:', error);
        throw error;
    }
}

/**
 * Get location ID for user
 */
async function getLocationId(userId) {
    try {
        const result = await pool.query(
            `SELECT location_id FROM google_business_connections
             WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new Error('No active GBP connection found');
        }

        const { location_id } = result.rows[0];

        if (!location_id) {
            throw new Error('No location ID found');
        }

        return location_id;

    } catch (error) {
        console.error('[GBP] Error getting location ID:', error);
        throw error;
    }
}

module.exports = {
    refreshAccessToken,
    getValidAccessToken,
    getLocationId
};
