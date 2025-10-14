/**
 * Check Database Schema
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        console.log('📋 Checking database schema...\n');

        // Check users table
        const usersColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log('Users table columns:');
        usersColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });

        console.log('\n✅ Schema check complete!');

    } catch (error) {
        console.error('❌ Schema check failed:', error);
    } finally {
        await client.end();
    }
}

checkSchema();
