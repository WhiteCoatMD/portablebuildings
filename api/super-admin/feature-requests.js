/**
 * Get all feature requests for super admin
 */

const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async function handler(req, res) {
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

        // Check if user is admin
        const userResult = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        // Fetch all feature requests
        const result = await pool.query(
            `SELECT
                id,
                user_id,
                user_email,
                business_name,
                title,
                description,
                status,
                admin_notes,
                created_at,
                updated_at
            FROM feature_requests
            ORDER BY
                CASE status
                    WHEN 'pending' THEN 1
                    WHEN 'in-progress' THEN 2
                    WHEN 'completed' THEN 3
                    WHEN 'declined' THEN 4
                END,
                created_at DESC`
        );

        return res.status(200).json({
            success: true,
            requests: result.rows
        });

    } catch (error) {
        console.error('Feature requests fetch error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
