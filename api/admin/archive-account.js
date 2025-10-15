/**
 * Archive User Account - Super Admin Only
 * Marks account as archived/inactive but keeps all data
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

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT email, is_admin FROM users WHERE id = $1',
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Don't allow archiving admin accounts
        if (userCheck.rows[0].is_admin) {
            return res.status(403).json({ success: false, error: 'Cannot archive admin accounts' });
        }

        // Archive the account by setting subscription to 'cancelled' and adding archived flag
        await pool.query(
            `UPDATE users
             SET subscription_status = 'cancelled',
                 features = COALESCE(features, '{}'::jsonb) || '{"archived": true}'::jsonb,
                 updated_at = NOW()
             WHERE id = $1`,
            [userId]
        );

        console.log(`✅ Account archived: User ID ${userId} (${userCheck.rows[0].email})`);

        res.json({
            success: true,
            message: 'Account archived successfully'
        });

    } catch (error) {
        console.error('Archive account error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to archive account',
            details: error.message
        });
    }
};
