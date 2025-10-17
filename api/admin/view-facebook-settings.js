/**
 * View Facebook settings in database
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
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

        // Get all Facebook-related settings
        const result = await pool.query(`
            SELECT setting_key, setting_value, created_at, updated_at
            FROM user_settings
            WHERE user_id = $1
            AND setting_key LIKE '%facebook%'
            ORDER BY setting_key
        `, [userId]);

        return res.json({
            success: true,
            userId: userId,
            settings: result.rows.map(row => ({
                key: row.setting_key,
                value: row.setting_value,
                created: row.created_at,
                updated: row.updated_at
            }))
        });

    } catch (error) {
        console.error('[View FB Settings] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
