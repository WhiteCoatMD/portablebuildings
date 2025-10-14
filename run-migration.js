/**
 * Run database migration for domain fields
 */
require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = getPool();

    try {
        console.log('Reading migration file...');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add-domain-fields.sql'),
            'utf8'
        );

        console.log('Running migration...');
        await pool.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

        // Show the updated users
        const result = await pool.query(
            'SELECT id, email, business_name, subdomain, custom_domain FROM users ORDER BY id'
        );

        console.log('\nUpdated users:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
