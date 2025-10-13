/**
 * Super Admin - Run Database Migration
 * Runs the user contact fields migration
 */

const { Pool } = require('pg');
const { requireAuth } = require('../../lib/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function handler(req, res) {
    // Check if user is admin
    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Run the migration
        await pool.query(`
            -- Add new contact fields to users table
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS address TEXT,
            ADD COLUMN IF NOT EXISTS best_contact_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS location_hours JSONB DEFAULT '{}'::jsonb;
        `);

        await pool.query(`
            -- Update timestamp
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE full_name IS NULL;
        `);

        return res.status(200).json({
            success: true,
            message: 'Migration completed successfully'
        });

    } catch (error) {
        console.error('Migration error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to run migration'
        });
    }
}

module.exports = requireAuth(handler);
