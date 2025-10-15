/**
 * Delete User Account - Super Admin Only
 * Permanently deletes user account and ALL associated data
 */
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify super admin
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user is super admin
        const adminCheck = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (!adminCheck.rows[0] || !adminCheck.rows[0].is_admin) {
            return res.status(403).json({ success: false, error: 'Super admin access required' });
        }

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        // Check if user exists and is not an admin
        const userCheck = await pool.query(
            'SELECT email, is_admin FROM users WHERE id = $1',
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Don't allow deleting admin accounts
        if (userCheck.rows[0].is_admin) {
            return res.status(403).json({ success: false, error: 'Cannot delete admin accounts' });
        }

        const userEmail = userCheck.rows[0].email;

        // Delete all associated data in correct order (due to foreign key constraints)
        // 1. Delete building overrides
        const overridesResult = await pool.query(
            'DELETE FROM building_overrides WHERE user_id = $1',
            [userId]
        );

        // 2. Delete image orders
        const imageOrdersResult = await pool.query(
            'DELETE FROM image_orders WHERE user_id = $1',
            [userId]
        );

        // 3. Delete posted buildings (Facebook posts)
        const postsResult = await pool.query(
            'DELETE FROM posted_buildings WHERE user_id = $1',
            [userId]
        );

        // 4. Delete user inventory
        const inventoryResult = await pool.query(
            'DELETE FROM user_inventory WHERE user_id = $1',
            [userId]
        );

        // 5. Delete user settings
        const settingsResult = await pool.query(
            'DELETE FROM user_settings WHERE user_id = $1',
            [userId]
        );

        // 6. Delete other lots
        const lotsResult = await pool.query(
            'DELETE FROM other_lots WHERE user_id = $1',
            [userId]
        );

        // 7. Delete sessions
        const sessionsResult = await pool.query(
            'DELETE FROM sessions WHERE user_id = $1',
            [userId]
        );

        // 8. Delete user account
        const userResult = await pool.query(
            'DELETE FROM users WHERE id = $1',
            [userId]
        );

        console.log(`🗑️ Account permanently deleted: ${userEmail}`);
        console.log(`   - ${inventoryResult.rowCount} buildings`);
        console.log(`   - ${overridesResult.rowCount} overrides`);
        console.log(`   - ${imageOrdersResult.rowCount} image orders`);
        console.log(`   - ${postsResult.rowCount} Facebook posts`);
        console.log(`   - ${settingsResult.rowCount} settings`);
        console.log(`   - ${lotsResult.rowCount} other lots`);
        console.log(`   - ${sessionsResult.rowCount} sessions`);
        console.log(`   - User account removed`);

        res.json({
            success: true,
            message: 'Account and all data permanently deleted',
            deleted: {
                buildings: inventoryResult.rowCount,
                overrides: overridesResult.rowCount,
                imageOrders: imageOrdersResult.rowCount,
                posts: postsResult.rowCount,
                settings: settingsResult.rowCount,
                lots: lotsResult.rowCount,
                sessions: sessionsResult.rowCount,
                user: userResult.rowCount
            }
        });

    } catch (error) {
        console.error('Delete account error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete account',
            details: error.message
        });
    }
};
