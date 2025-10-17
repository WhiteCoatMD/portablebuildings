/**
 * Admin endpoint to run leads migration
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');
const fs = require('fs');
const path = require('path');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify authentication
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

        console.log('[Leads Migration] Running migration...');

        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'db', 'migrations', '005_create_leads_system.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await pool.query(sql);

        console.log('[Leads Migration] Migration completed successfully');

        return res.json({
            success: true,
            message: 'Leads system migration completed successfully',
            tables: ['leads', 'lead_activities'],
            triggers: ['update_leads_timestamp', 'log_lead_status_change', 'log_lead_creation']
        });

    } catch (error) {
        console.error('[Leads Migration] Error:', error);

        // Check if tables already exist
        if (error.message && error.message.includes('already exists')) {
            return res.json({
                success: true,
                message: 'Tables already exist - migration skipped',
                alreadyExists: true
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to run migration'
        });
    }
};
