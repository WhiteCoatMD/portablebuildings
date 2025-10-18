/**
 * Create facebook_post_queue table
 * Stores buildings waiting to be posted based on schedule settings
 */

const { getPool } = require('./lib/db');

async function createPostQueueTable() {
    const pool = getPool();

    try {
        console.log('Creating facebook_post_queue table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS facebook_post_queue (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                building_serial_number VARCHAR(255) NOT NULL,
                building_data JSONB NOT NULL,
                scheduled_time TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                posted_at TIMESTAMP,
                UNIQUE(user_id, building_serial_number)
            )
        `);

        console.log('✓ facebook_post_queue table created');

        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_post_queue_user_id
            ON facebook_post_queue(user_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_post_queue_scheduled_time
            ON facebook_post_queue(scheduled_time)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_post_queue_status
            ON facebook_post_queue(status)
        `);

        console.log('✓ Indexes created');
        console.log('Post queue table setup complete!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating post queue table:', error);
        process.exit(1);
    }
}

createPostQueueTable();
