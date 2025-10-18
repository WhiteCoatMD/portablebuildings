/**
 * Create table to track Facebook template usage per dealer
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log('Creating template_usage table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS template_usage (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                template_text TEXT NOT NULL,
                template_hash VARCHAR(64) NOT NULL,
                used_at TIMESTAMP NOT NULL DEFAULT NOW(),
                is_manual BOOLEAN DEFAULT false,
                building_serial VARCHAR(100),
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);
        console.log('✅ template_usage table created');

        // Create indexes for efficient queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_template_usage_user_id ON template_usage(user_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_template_usage_hash ON template_usage(template_hash)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_template_usage_used_at ON template_usage(used_at)
        `);
        console.log('✅ Indexes created for template_usage');

        await pool.end();
        console.log('✅ Template usage tracking table created successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
