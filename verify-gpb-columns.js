/**
 * Verify GPB Columns
 * Checks that all GPB credential columns exist in users table
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function verifyColumns() {
    console.log('🔍 Verifying users table schema...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        // Get all columns for users table
        const result = await client.query(`
            SELECT column_name, data_type, character_maximum_length, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log(`Found ${result.rows.length} columns in users table:\n`);

        const gpbColumns = ['gpb_username', 'gpb_password_encrypted', 'auto_sync_enabled'];
        let allFound = true;

        result.rows.forEach(col => {
            const isGpbColumn = gpbColumns.includes(col.column_name);
            const marker = isGpbColumn ? '🔑' : '  ';
            console.log(`${marker} ${col.column_name.padEnd(30)} ${col.data_type}`);

            if (isGpbColumn) {
                gpbColumns.splice(gpbColumns.indexOf(col.column_name), 1);
            }
        });

        if (gpbColumns.length > 0) {
            console.log('\n❌ Missing columns:', gpbColumns.join(', '));
            allFound = false;
        } else {
            console.log('\n✅ All GPB credential columns are present!');
        }

        // Test that we can query them
        console.log('\n📋 Testing query with GPB columns...');
        const testQuery = await client.query(`
            SELECT id, email, gpb_username, auto_sync_enabled
            FROM users
            LIMIT 3
        `);

        console.log(`✅ Query successful! Found ${testQuery.rows.length} users`);
        testQuery.rows.forEach(user => {
            const hasGpb = user.gpb_username ? '✓' : '✗';
            const autoSync = user.auto_sync_enabled ? 'enabled' : 'disabled';
            console.log(`  ${hasGpb} ${user.email} - Auto-sync: ${autoSync}`);
        });

        console.log('\n🎉 Schema verification complete!\n');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

verifyColumns()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
