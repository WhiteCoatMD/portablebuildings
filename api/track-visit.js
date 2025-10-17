/**
 * Track website visits for dealer websites
 */

const { getPool } = require('../lib/db');

const pool = getPool();

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { subdomain, pagePath, referrer, fingerprint, sessionId } = req.body;

        if (!subdomain) {
            return res.status(400).json({
                success: false,
                error: 'Subdomain is required'
            });
        }

        // Get user ID from subdomain
        const userResult = await pool.query(
            'SELECT id FROM users WHERE subdomain = $1',
            [subdomain]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userId = userResult.rows[0].id;

        // Get visitor info
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                         req.connection?.remoteAddress ||
                         req.socket?.remoteAddress ||
                         'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Check if this is a unique visitor (within last 24 hours)
        const visitorFingerprint = fingerprint || `${ipAddress}_${userAgent}`;

        const existingVisitorResult = await pool.query(
            `SELECT id FROM website_traffic
             WHERE user_id = $1
             AND visitor_fingerprint = $2
             AND created_at >= NOW() - INTERVAL '24 hours'
             LIMIT 1`,
            [userId, visitorFingerprint]
        );

        const isUniqueVisitor = existingVisitorResult.rows.length === 0;

        // Log the visit
        await pool.query(
            `INSERT INTO website_traffic
            (user_id, subdomain, visitor_ip, visitor_fingerprint, page_path, referrer, user_agent, is_unique_visitor, session_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [userId, subdomain, ipAddress, visitorFingerprint, pagePath || '/', referrer || null, userAgent, isUniqueVisitor, sessionId || null]
        );

        // Update summary table
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
            `INSERT INTO traffic_summary (user_id, date, unique_visitors, total_pageviews, updated_at)
             VALUES ($1, $2, $3, 1, NOW())
             ON CONFLICT (user_id, date)
             DO UPDATE SET
                unique_visitors = traffic_summary.unique_visitors + $3,
                total_pageviews = traffic_summary.total_pageviews + 1,
                updated_at = NOW()`,
            [userId, today, isUniqueVisitor ? 1 : 0]
        );

        return res.status(200).json({
            success: true,
            tracked: true,
            isUniqueVisitor
        });

    } catch (error) {
        console.error('Track visit error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
