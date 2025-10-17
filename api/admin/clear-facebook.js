/**
 * Admin endpoint to clear Facebook tokens
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        const userId = decoded.userId;

        console.log('[Clear FB] Clearing Facebook tokens for user:', userId);

        // Delete all Facebook-related settings for this user
        const result = await pool.query(`
            DELETE FROM user_settings
            WHERE user_id = $1
            AND setting_key IN (
                'cpb_facebook_page_id',
                'cpb_facebook_access_token',
                'cpb_facebook_page_name',
                'cpb_facebook_config'
            )
        `, [userId]);

        console.log(`[Clear FB] Deleted ${result.rowCount} settings`);

        return res.json({
            success: true,
            deletedCount: result.rowCount,
            message: 'Facebook tokens cleared. Please reconnect.'
        });

    } catch (error) {
        console.error('[Clear FB] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear Facebook tokens'
        });
    }
};
