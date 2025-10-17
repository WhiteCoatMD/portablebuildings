/**
 * Feature Request API
 * Allows users to submit feature requests that are stored for super admin review
 */

const { getPool } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

const pool = getPool();

module.exports = async function handler(req, res) {
    // Only allow POST requests
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

        const { title, description } = req.body;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        // Get user info for the request
        const userResult = await pool.query(
            'SELECT email, business_name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Insert feature request into database
        const insertResult = await pool.query(
            `INSERT INTO feature_requests
            (user_id, user_email, business_name, title, description, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id`,
            [
                decoded.userId,
                user.email,
                user.business_name || 'Unknown',
                title.substring(0, 100),
                description.substring(0, 1000),
                'pending'
            ]
        );

        return res.status(200).json({
            success: true,
            requestId: insertResult.rows[0].id,
            message: 'Feature request submitted successfully'
        });

    } catch (error) {
        console.error('Feature request error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
