/**
 * Run leads system migration
 */
const { getPool } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = getPool();

    try {
        console.log('Running leads system migration...');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'db', 'migrations', '005_create_leads_system.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await pool.query(sql);

        console.log('✅ Leads system migration completed successfully!');
        console.log('Created tables:');
        console.log('  - leads');
        console.log('  - lead_activities');
        console.log('Created triggers:');
        console.log('  - update_leads_timestamp');
        console.log('  - log_lead_status_change');
        console.log('  - log_lead_creation');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
