/**
 * Create feature_requests table
 */
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        console.log('Creating feature_requests table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS feature_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                user_email VARCHAR(255) NOT NULL,
                business_name VARCHAR(255),
                title VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ feature_requests table created successfully!');

        // Create index on user_id for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON feature_requests(user_id)
        `);

        // Create index on status for filtering
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status)
        `);

        console.log('✅ Indexes created successfully!');

        await pool.end();
        console.log('✅ Database setup complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
