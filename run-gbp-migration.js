/**
 * Run GBP table migration using local environment
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function runMigration() {
    try {
        console.log('Running GBP table migration...');

        // Check if table already exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'google_business_connections'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Table already exists!');
            await pool.end();
            process.exit(0);
        }

        console.log('Creating google_business_connections table...');

        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS google_business_connections (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                token_expires_at TIMESTAMP,
                account_id VARCHAR(255),
                account_name VARCHAR(255),
                location_id VARCHAR(255),
                location_name VARCHAR(255),
                location_address TEXT,
                is_active BOOLEAN DEFAULT true,
                last_post_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id)
            )
        `);

        console.log('✅ Table created successfully!');

        // Create index
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_google_business_user_id
            ON google_business_connections(user_id)
        `);

        console.log('✅ Index created successfully!');
        console.log('✅ Migration complete!');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
