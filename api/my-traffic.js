/**
 * Get current user's website traffic statistics
 */

const { getPool } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

const pool = getPool();

module.exports = async function handler(req, res) {
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

        const userId = decoded.userId;
        const { days = 30 } = req.query;
        const daysInt = parseInt(days);

        // Total stats
        const totalResult = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE is_unique_visitor = true) as unique_visitors,
                COUNT(*) as total_pageviews
             FROM website_traffic
             WHERE user_id = $1
             AND created_at >= NOW() - INTERVAL '${daysInt} days'`,
            [userId]
        );

        // Daily breakdown
        const dailyResult = await pool.query(
            `SELECT
                DATE(created_at) as date,
                COUNT(*) FILTER (WHERE is_unique_visitor = true) as unique_visitors,
                COUNT(*) as pageviews
             FROM website_traffic
             WHERE user_id = $1
             AND created_at >= NOW() - INTERVAL '${daysInt} days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            [userId]
        );

        // Top pages
        const topPagesResult = await pool.query(
            `SELECT
                page_path,
                COUNT(*) as views
             FROM website_traffic
             WHERE user_id = $1
             AND created_at >= NOW() - INTERVAL '${daysInt} days'
             GROUP BY page_path
             ORDER BY views DESC
             LIMIT 10`,
            [userId]
        );

        // Referrers
        const referrersResult = await pool.query(
            `SELECT
                referrer,
                COUNT(*) as count
             FROM website_traffic
             WHERE user_id = $1
             AND referrer IS NOT NULL
             AND referrer != ''
             AND created_at >= NOW() - INTERVAL '${daysInt} days'
             GROUP BY referrer
             ORDER BY count DESC
             LIMIT 10`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            traffic: {
                totalStats: totalResult.rows[0] || { unique_visitors: 0, total_pageviews: 0 },
                dailyBreakdown: dailyResult.rows,
                topPages: topPagesResult.rows,
                topReferrers: referrersResult.rows
            }
        });

    } catch (error) {
        console.error('Get traffic error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
