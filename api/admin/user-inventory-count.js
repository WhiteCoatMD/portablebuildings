/**
 * Super Admin - Get User Inventory Counts
 * Returns the count of buildings PER USER from the database
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');

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

    const pool = getPool();

    try {
        // Get inventory counts for each user
        const result = await pool.query(`
            SELECT user_id, COUNT(*) as count
            FROM user_inventory
            GROUP BY user_id
        `);

        // Convert to an object with userId => count
        const counts = {};
        result.rows.forEach(row => {
            counts[row.user_id] = parseInt(row.count);
        });

        return res.status(200).json({
            success: true,
            counts // Returns { userId: count, ... }
        });

    } catch (error) {
        console.error('Get inventory counts error:', error);
        return res.status(200).json({
            success: true,
            counts: {} // Return empty object on error
        });
    }
}

module.exports = requireAuth(handler);
