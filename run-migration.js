/**
 * Run database migration
 * Usage: node run-migration.js <migration-file>
 */
require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
    const pool = getPool();

    try {
        const migrationPath = path.join(__dirname, 'db', 'migrations', migrationFile);

        if (!fs.existsSync(migrationPath)) {
            console.error(`Migration file not found: ${migrationPath}`);
            process.exit(1);
        }

        console.log(`Reading migration file: ${migrationFile}...`);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await pool.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file>');
    console.error('Example: node run-migration.js 006_create_demo_leads.sql');
    process.exit(1);
}

runMigration(migrationFile);
