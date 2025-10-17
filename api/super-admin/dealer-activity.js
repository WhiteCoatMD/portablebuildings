/**
 * Get dealer activity statistics
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

        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Get activity statistics
        const stats = {};

        // Last login
        const lastLoginResult = await pool.query(
            `SELECT created_at FROM dealer_activity_log
             WHERE user_id = $1 AND activity_type = 'login'
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        stats.lastLogin = lastLoginResult.rows[0]?.created_at || null;

        // Login count (last 30 days)
        const loginCountResult = await pool.query(
            `SELECT COUNT(*) as count FROM dealer_activity_log
             WHERE user_id = $1 AND activity_type = 'login'
             AND created_at >= NOW() - INTERVAL '30 days'`,
            [userId]
        );
        stats.loginCount30d = parseInt(loginCountResult.rows[0]?.count || 0);

        // Lead checks (last 30 days)
        const leadChecksResult = await pool.query(
            `SELECT COUNT(*) as count FROM dealer_activity_log
             WHERE user_id = $1 AND activity_type = 'view_leads'
             AND created_at >= NOW() - INTERVAL '30 days'`,
            [userId]
        );
        stats.leadChecks30d = parseInt(leadChecksResult.rows[0]?.count || 0);

        // Last lead check
        const lastLeadCheckResult = await pool.query(
            `SELECT created_at FROM dealer_activity_log
             WHERE user_id = $1 AND activity_type = 'view_leads'
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        stats.lastLeadCheck = lastLeadCheckResult.rows[0]?.created_at || null;

        // Recent activity (last 7 days by activity type)
        const recentActivityResult = await pool.query(
            `SELECT
                activity_type,
                COUNT(*) as count,
                MAX(created_at) as last_occurrence
             FROM dealer_activity_log
             WHERE user_id = $1
             AND created_at >= NOW() - INTERVAL '7 days'
             GROUP BY activity_type
             ORDER BY count DESC`,
            [userId]
        );
        stats.recentActivity = recentActivityResult.rows;

        // Activity timeline (last 30 entries)
        const timelineResult = await pool.query(
            `SELECT
                activity_type,
                details,
                created_at
             FROM dealer_activity_log
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 30`,
            [userId]
        );
        stats.activityTimeline = timelineResult.rows;

        // Website traffic stats
        const trafficResult = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE is_unique_visitor = true) as unique_visitors,
                COUNT(*) as total_pageviews
             FROM website_traffic
             WHERE user_id = $1
             AND created_at >= NOW() - INTERVAL '30 days'`,
            [userId]
        );
        stats.websiteTraffic = {
            uniqueVisitors30d: parseInt(trafficResult.rows[0]?.unique_visitors || 0),
            totalPageviews30d: parseInt(trafficResult.rows[0]?.total_pageviews || 0)
        };

        // Traffic by day (last 7 days)
        const trafficByDayResult = await pool.query(
            `SELECT
                DATE(created_at) as date,
                COUNT(*) FILTER (WHERE is_unique_visitor = true) as unique_visitors,
                COUNT(*) as pageviews
             FROM website_traffic
             WHERE user_id = $1
             AND created_at >= NOW() - INTERVAL '7 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            [userId]
        );
        stats.trafficByDay = trafficByDayResult.rows;

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Dealer activity fetch error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
