/**
 * Super Admin - User Management API
 * List all users and get statistics
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

    if (req.method === 'GET') {
        return await getUsers(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}

async function getUsers(req, res) {
    try {
        // Get all users with their stats
        const result = await pool.query(`
            SELECT
                u.id,
                u.email,
                u.business_name,
                u.full_name,
                u.phone,
                u.address,
                u.best_contact_email,
                u.location_hours,
                u.is_admin,
                u.subscription_status,
                u.subscription_plan,
                u.subscription_start_date,
                u.subscription_end_date,
                u.features,
                u.last_login_at,
                u.created_at,
                (SELECT COUNT(*) FROM building_overrides WHERE user_id = u.id) as building_count,
                (SELECT COUNT(*) FROM image_orders WHERE user_id = u.id) as images_count,
                (SELECT COUNT(*) FROM posted_buildings WHERE user_id = u.id) as posts_count,
                (SELECT COUNT(*) FROM other_lots WHERE user_id = u.id) as other_lots_count
            FROM users u
            ORDER BY u.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
}

module.exports = requireAuth(handler);
