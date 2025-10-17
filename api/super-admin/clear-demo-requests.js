/**
 * Super Admin: Clear all demo requests
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') {
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

        // Verify admin access
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

        // Delete all demo requests
        const result = await pool.query('DELETE FROM demo_leads');

        return res.json({
            success: true,
            deleted: result.rowCount,
            message: `Successfully deleted ${result.rowCount} demo request(s)`
        });

    } catch (error) {
        console.error('[Super Admin Clear Demo Requests] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear demo requests'
        });
    }
};
