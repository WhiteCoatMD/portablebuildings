/**
 * Log dealer portal activity
 */

const { getPool } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

const pool = getPool();

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
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

        const { activityType, details } = req.body;

        if (!activityType) {
            return res.status(400).json({
                success: false,
                error: 'Activity type is required'
            });
        }

        // Get IP and user agent from request
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                         req.connection?.remoteAddress ||
                         req.socket?.remoteAddress ||
                         'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Log the activity
        await pool.query(
            `INSERT INTO dealer_activity_log
            (user_id, activity_type, details, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())`,
            [decoded.userId, activityType, JSON.stringify(details || {}), ipAddress, userAgent]
        );

        return res.status(200).json({
            success: true,
            message: 'Activity logged'
        });

    } catch (error) {
        console.error('Log activity error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
