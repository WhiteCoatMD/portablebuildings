/**
 * Super Admin - Run Inventory Migration
 * Creates the user_inventory table for multi-tenant inventory storage
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');
const fs = require('fs');
const path = require('path');

const pool = getPool();

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
        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'db', 'migrations', '003_create_user_inventory.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        // Execute the migration
        await pool.query(sql);

        return res.status(200).json({
            success: true,
            message: 'Inventory migration completed successfully. Each user now has their own inventory.'
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
