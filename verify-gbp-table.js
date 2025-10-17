/**
 * Verify GBP table was created successfully
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function verify() {
    try {
        console.log('Verifying google_business_connections table...\n');

        // Check table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'google_business_connections'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Table does not exist!');
            await pool.end();
            process.exit(1);
        }

        console.log('✅ Table exists!');

        // Get table structure
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'google_business_connections'
            ORDER BY ordinal_position;
        `);

        console.log('\nTable Structure:');
        console.log('================');
        columns.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(30)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Check indexes
        const indexes = await pool.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'google_business_connections';
        `);

        console.log('\nIndexes:');
        console.log('========');
        indexes.rows.forEach(idx => {
            console.log(`  ${idx.indexname}`);
        });

        console.log('\n✅ Verification complete!');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification failed:', error);
        await pool.end();
        process.exit(1);
    }
}

verify();
