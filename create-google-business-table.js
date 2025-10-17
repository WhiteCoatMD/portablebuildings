/**
 * Create google_business_connections table
 * Stores OAuth tokens and location info for Google Business Profile integration
 */

const { getPool } = require('./lib/db');

const pool = getPool();

async function createTable() {
    try {
        console.log('Creating google_business_connections table...');

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

        console.log('✅ google_business_connections table created successfully!');

        // Create index on user_id for faster lookups
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_google_business_user_id
            ON google_business_connections(user_id)
        `);

        console.log('✅ Index created successfully!');

    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

createTable()
    .then(() => {
        console.log('Migration completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
