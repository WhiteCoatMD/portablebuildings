/**
 * Create tables for tracking dealer activity and website traffic
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
        console.log('Creating activity tracking tables...');

        // Table for dealer portal activity
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dealer_activity_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(50) NOT NULL,
                details JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);
        console.log('✅ dealer_activity_log table created');

        // Create indexes for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_dealer_activity_user_id ON dealer_activity_log(user_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_dealer_activity_type ON dealer_activity_log(activity_type)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_dealer_activity_created_at ON dealer_activity_log(created_at)
        `);
        console.log('✅ Indexes created for dealer_activity_log');

        // Table for website traffic tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS website_traffic (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subdomain VARCHAR(50),
                visitor_ip VARCHAR(45),
                visitor_fingerprint VARCHAR(255),
                page_path VARCHAR(255),
                referrer TEXT,
                user_agent TEXT,
                country VARCHAR(2),
                city VARCHAR(100),
                is_unique_visitor BOOLEAN DEFAULT true,
                session_id VARCHAR(100),
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);
        console.log('✅ website_traffic table created');

        // Create indexes for traffic table
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_website_traffic_user_id ON website_traffic(user_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_website_traffic_subdomain ON website_traffic(subdomain)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_website_traffic_fingerprint ON website_traffic(visitor_fingerprint)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_website_traffic_created_at ON website_traffic(created_at)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_website_traffic_unique ON website_traffic(is_unique_visitor)
        `);
        console.log('✅ Indexes created for website_traffic');

        // Create a summary table for quick stats
        await pool.query(`
            CREATE TABLE IF NOT EXISTS traffic_summary (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                unique_visitors INTEGER DEFAULT 0,
                total_pageviews INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, date)
            )
        `);
        console.log('✅ traffic_summary table created');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_traffic_summary_user_date ON traffic_summary(user_id, date)
        `);
        console.log('✅ Index created for traffic_summary');

        await pool.end();
        console.log('✅ All activity tracking tables created successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
