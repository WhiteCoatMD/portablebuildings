/**
 * Super Admin - System Statistics API
 * Get system-wide statistics
 */

const { sql } = require('@vercel/postgres');
const { requireAuth } = require('../../lib/auth');

async function handler(req, res) {
    // Check if user is admin
    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Get total users count
        const totalUsersResult = await sql`SELECT COUNT(*) as count FROM users`;
        const totalUsers = parseInt(totalUsersResult.rows[0].count);

        // Get active users (logged in within last 30 days)
        const activeUsersResult = await sql`
            SELECT COUNT(*) as count
            FROM users
            WHERE last_login_at > NOW() - INTERVAL '30 days'
        `;
        const activeUsers = parseInt(activeUsersResult.rows[0].count);

        // Get subscription breakdown
        const subscriptionsResult = await sql`
            SELECT subscription_status, subscription_plan, COUNT(*) as count
            FROM users
            GROUP BY subscription_status, subscription_plan
            ORDER BY subscription_status, subscription_plan
        `;

        // Get total buildings across all users
        const totalBuildingsResult = await sql`
            SELECT COUNT(*) as count FROM building_overrides
        `;
        const totalBuildings = parseInt(totalBuildingsResult.rows[0].count);

        // Get total images uploaded
        const totalImagesResult = await sql`
            SELECT COUNT(*) as count FROM image_orders
        `;
        const totalImages = parseInt(totalImagesResult.rows[0].count);

        // Get total Facebook posts
        const totalPostsResult = await sql`
            SELECT COUNT(*) as count FROM posted_buildings
        `;
        const totalPosts = parseInt(totalPostsResult.rows[0].count);

        // Get recent signups (last 7 days)
        const recentSignupsResult = await sql`
            SELECT COUNT(*) as count
            FROM users
            WHERE created_at > NOW() - INTERVAL '7 days'
        `;
        const recentSignups = parseInt(recentSignupsResult.rows[0].count);

        // Get users with multi-lot feature enabled
        const multiLotUsersResult = await sql`
            SELECT COUNT(*) as count
            FROM users
            WHERE features->>'multiLot' = 'true'
        `;
        const multiLotUsers = parseInt(multiLotUsersResult.rows[0].count);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                recentSignups,
                totalBuildings,
                totalImages,
                totalPosts,
                multiLotUsers,
                subscriptions: subscriptionsResult.rows
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
}

module.exports = requireAuth(handler);
