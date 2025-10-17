/**
 * Admin endpoint to create google_business_connections table
 * Only run once to set up the database
 */

const { getPool } = require('../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    // Simple authentication - require a secret key
    const { secret } = req.body;

    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    try {
        console.log('Creating google_business_connections table...');

        // Check if table already exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'google_business_connections'
            );
        `);

        if (tableCheck.rows[0].exists) {
            return res.status(200).json({
                success: true,
                message: 'Table already exists',
                alreadyExists: true
            });
        }

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

        console.log('✅ google_business_connections table created successfully!');

        // Create index on user_id for faster lookups
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_google_business_user_id
            ON google_business_connections(user_id)
        `);

        console.log('✅ Index created successfully!');

        return res.status(200).json({
            success: true,
            message: 'google_business_connections table created successfully',
            alreadyExists: false
        });

    } catch (error) {
        console.error('❌ Error creating table:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create table',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
