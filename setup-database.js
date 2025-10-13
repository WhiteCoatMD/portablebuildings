/**
 * Database Setup Script
 * Run this once to set up or update your database schema
 */

const { sql } = require('@vercel/postgres');

async function setupDatabase() {
    console.log('🔧 Setting up database...\n');

    try {
        // Create users table with all fields
        console.log('Creating users table...');
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                business_name VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                subscription_status VARCHAR(50) DEFAULT 'trial',
                subscription_plan VARCHAR(50) DEFAULT 'free',
                subscription_start_date TIMESTAMP,
                subscription_end_date TIMESTAMP,
                features JSONB DEFAULT '{"multiLot": false}'::jsonb,
                last_login_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Users table ready\n');

        // Create user_settings table
        console.log('Creating user_settings table...');
        await sql`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, setting_key)
            )
        `;
        console.log('✅ User settings table ready\n');

        // Create building_overrides table
        console.log('Creating building_overrides table...');
        await sql`
            CREATE TABLE IF NOT EXISTS building_overrides (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                serial_number VARCHAR(100) NOT NULL,
                status VARCHAR(50),
                hidden BOOLEAN DEFAULT FALSE,
                lot_location VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, serial_number)
            )
        `;
        console.log('✅ Building overrides table ready\n');

        // Create image_orders table
        console.log('Creating image_orders table...');
        await sql`
            CREATE TABLE IF NOT EXISTS image_orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                serial_number VARCHAR(100) NOT NULL,
                image_urls TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, serial_number)
            )
        `;
        console.log('✅ Image orders table ready\n');

        // Create other_lots table
        console.log('Creating other_lots table...');
        await sql`
            CREATE TABLE IF NOT EXISTS other_lots (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                last_sync TIMESTAMP,
                building_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Other lots table ready\n');

        // Create posted_buildings table
        console.log('Creating posted_buildings table...');
        await sql`
            CREATE TABLE IF NOT EXISTS posted_buildings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                serial_number VARCHAR(100) NOT NULL,
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, serial_number)
            )
        `;
        console.log('✅ Posted buildings table ready\n');

        // Create sessions table
        console.log('Creating sessions table...');
        await sql`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Sessions table ready\n');

        // Create indexes
        console.log('Creating indexes...');
        await sql`CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_building_overrides_user_id ON building_overrides(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_image_orders_user_id ON image_orders(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
        console.log('✅ Indexes ready\n');

        console.log('🎉 Database setup complete!\n');
        console.log('Next steps:');
        console.log('1. Create your admin account at /signup.html');
        console.log('2. Make yourself an admin by running: node make-admin.js your-email@example.com');
        console.log('3. Deploy your site!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    }
}

setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
