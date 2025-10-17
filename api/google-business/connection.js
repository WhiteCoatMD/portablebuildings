/**
 * Google Business Profile connection management
 * GET: Check connection status
 * DELETE: Disconnect GBP
 */

const { getPool } = require('../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId parameter is required'
            });
        }

        if (req.method === 'GET') {
            // Get connection status
            const result = await pool.query(
                `SELECT
                    id,
                    account_name,
                    location_name,
                    location_address,
                    is_active,
                    last_post_at,
                    created_at,
                    token_expires_at
                 FROM google_business_connections
                 WHERE user_id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(200).json({
                    success: true,
                    connected: false
                });
            }

            const connection = result.rows[0];

            // Check if token is expired or about to expire
            const tokenExpiresAt = new Date(connection.token_expires_at);
            const now = new Date();
            const expiresIn = Math.floor((tokenExpiresAt - now) / 1000); // seconds
            const needsRefresh = expiresIn < 300; // Less than 5 minutes

            return res.status(200).json({
                success: true,
                connected: true,
                connection: {
                    accountName: connection.account_name,
                    locationName: connection.location_name,
                    locationAddress: connection.location_address,
                    isActive: connection.is_active,
                    lastPostAt: connection.last_post_at,
                    connectedAt: connection.created_at,
                    tokenNeedsRefresh: needsRefresh
                }
            });

        } else if (req.method === 'DELETE') {
            // Disconnect GBP
            await pool.query(
                `DELETE FROM google_business_connections
                 WHERE user_id = $1`,
                [userId]
            );

            return res.status(200).json({
                success: true,
                message: 'Google Business Profile disconnected'
            });

        } else {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('[GBP Connection] Error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process request',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
