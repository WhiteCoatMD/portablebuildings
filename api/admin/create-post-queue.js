/**
 * API endpoint to create facebook_post_queue table
 * GET /api/admin/create-post-queue
 */

const { getPool } = require('../../lib/db');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        return res.json({
            success: true,
            message: 'Post queue table created successfully'
        });

    } catch (error) {
        console.error('Error creating post queue table:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
