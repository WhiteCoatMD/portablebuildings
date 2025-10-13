/**
 * Super Admin - System Statistics API
 * Get system-wide statistics
 */

const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

const pool = getPool();

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
        const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(totalUsersResult.rows[0].count);

        // Get active users (logged in within last 30 days)
        const activeUsersResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE last_login_at > NOW() - INTERVAL '30 days'
        `);
        const activeUsers = parseInt(activeUsersResult.rows[0].count);

        // Get subscription breakdown
        const subscriptionsResult = await pool.query(`
            SELECT subscription_status, subscription_plan, COUNT(*) as count
            FROM users
            GROUP BY subscription_status, subscription_plan
            ORDER BY subscription_status, subscription_plan
        `);

        // Get total buildings from inventory file
        let totalBuildings = 0;
        try {
            const fs = require('fs');
            const path = require('path');
            const inventoryPath = path.join(process.cwd(), 'inventory.js');

            if (fs.existsSync(inventoryPath)) {
                const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');
                const match = inventoryContent.match(/window\.PROCESSED_INVENTORY\s*=\s*(\[[\s\S]*?\]);/);
                if (match) {
                    const inventory = eval(match[1]);
                    totalBuildings = Array.isArray(inventory) ? inventory.length : 0;
                }
            }
        } catch (error) {
            console.error('Error reading inventory:', error);
            totalBuildings = 0;
        }

        // Get total images uploaded
        const totalImagesResult = await pool.query('SELECT COUNT(*) as count FROM image_orders');
        const totalImages = parseInt(totalImagesResult.rows[0].count);

        // Get total Facebook posts
        const totalPostsResult = await pool.query('SELECT COUNT(*) as count FROM posted_buildings');
        const totalPosts = parseInt(totalPostsResult.rows[0].count);

        // Get recent signups (last 7 days)
        const recentSignupsResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE created_at > NOW() - INTERVAL '7 days'
        `);
        const recentSignups = parseInt(recentSignupsResult.rows[0].count);

        // Get users with multi-lot feature enabled
        const multiLotUsersResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE features->>'multiLot' = 'true'
        `);
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
