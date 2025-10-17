/**
 * Update feature request status
 */

const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async function handler(req, res) {
    // Only allow PATCH requests
    if (req.method !== 'PATCH') {
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

        const { requestId, status, adminNotes } = req.body;

        // Validate required fields
        if (!requestId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Request ID and status are required'
            });
        }

        // Validate status value
        const validStatuses = ['pending', 'in-progress', 'completed', 'declined', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status value'
            });
        }

        // Update the feature request
        const updateQuery = adminNotes !== undefined
            ? 'UPDATE feature_requests SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *'
            : 'UPDATE feature_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';

        const updateParams = adminNotes !== undefined
            ? [status, adminNotes, requestId]
            : [status, requestId];

        const result = await pool.query(updateQuery, updateParams);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Feature request not found'
            });
        }

        return res.status(200).json({
            success: true,
            request: result.rows[0]
        });

    } catch (error) {
        console.error('Update feature request error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
