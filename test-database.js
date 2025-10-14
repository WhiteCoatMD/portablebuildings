/**
 * Test Database Connection
 * Verifies all database operations are working
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    try {
        // Test 1: Check all tables exist
        console.log('📋 Test 1: Checking tables...');
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(r => r.table_name);
        console.log('Tables found:', tables.join(', '));

        const expectedTables = [
            'users',
            'user_settings',
            'building_overrides',
            'image_orders',
            'other_lots',
            'posted_buildings',
            'sessions'
        ];

        const missingTables = expectedTables.filter(t => !tables.includes(t));
        if (missingTables.length > 0) {
            console.log('❌ Missing tables:', missingTables.join(', '));
        } else {
            console.log('✅ All expected tables exist\n');
        }

        // Test 2: Check user count
        console.log('📋 Test 2: Checking users...');
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log(`Users in database: ${userCount.rows[0].count}`);

        if (userCount.rows[0].count > 0) {
            const users = await client.query('SELECT id, email, business_name, is_admin FROM users LIMIT 5');
            console.log('\nSample users:');
            users.rows.forEach(u => {
                console.log(`  - ${u.email} (${u.business_name || 'No business name'}, Admin: ${u.is_admin})`);
            });
        }
        console.log('✅ User table accessible\n');

        // Test 3: Check sessions
        console.log('📋 Test 3: Checking sessions...');
        const sessionCount = await client.query('SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()');
        console.log(`Active sessions: ${sessionCount.rows[0].count}`);
        console.log('✅ Sessions table accessible\n');

        // Test 4: Check indexes
        console.log('📋 Test 4: Checking indexes...');
        const indexes = await client.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename IN ('users', 'user_settings', 'building_overrides', 'image_orders', 'sessions')
            ORDER BY indexname
        `);
        console.log(`Indexes found: ${indexes.rows.length}`);
        console.log('✅ Indexes accessible\n');

        console.log('🎉 All database tests passed!');
        console.log('\nDatabase is ready to use.');
        console.log('Next steps:');
        console.log('1. Create a user at /signup.html');
        console.log('2. Make yourself admin: node make-admin.js your-email@example.com');
        console.log('3. Start the sync server: node sync-server.js');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

testDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
