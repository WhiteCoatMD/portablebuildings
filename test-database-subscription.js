/**
 * Test Database Subscription Schema
 * Verifies all subscription fields exist in the users table
 */
require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

async function testDatabaseSchema() {
    console.log('\n🧪 Testing Database Subscription Schema...\n');

    const pool = getPool();

    try {
        // Test 1: Check if subscription columns exist
        console.log('Test 1: Checking subscription columns...');
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN (
                'subscription_status',
                'subscription_id',
                'stripe_customer_id',
                'subscription_current_period_end',
                'trial_ends_at'
            )
            ORDER BY column_name
        `);

        const expectedColumns = [
            'subscription_status',
            'subscription_id',
            'stripe_customer_id',
            'subscription_current_period_end',
            'trial_ends_at'
        ];

        const foundColumns = result.rows.map(row => row.column_name);
        const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));

        if (missingColumns.length > 0) {
            console.error(`❌ Missing columns: ${missingColumns.join(', ')}\n`);
            console.log('💡 Run this to add missing columns:');
            console.log('   node add-subscription-fields.js\n');
            return false;
        }

        console.log('✅ All subscription columns exist:\n');
        result.rows.forEach(row => {
            console.log(`   - ${row.column_name}`);
            console.log(`     Type: ${row.data_type}`);
            console.log(`     Nullable: ${row.is_nullable}`);
            console.log(`     Default: ${row.column_default || 'NULL'}\n`);
        });

        // Test 2: Check user_settings table
        console.log('Test 2: Checking user_settings table...');
        const settingsTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'user_settings'
            )
        `);

        if (settingsTableCheck.rows[0].exists) {
            console.log('✅ user_settings table exists\n');
        } else {
            console.log('⚠️  user_settings table does not exist (not critical for subscriptions)\n');
        }

        // Test 3: Test a sample query
        console.log('Test 3: Testing subscription query...');
        const testQuery = await pool.query(`
            SELECT id, email, subscription_status, subscription_id, stripe_customer_id
            FROM users
            WHERE subscription_status IS NOT NULL
            LIMIT 3
        `);

        console.log(`✅ Query successful (found ${testQuery.rows.length} users with subscription data)`);
        if (testQuery.rows.length > 0) {
            console.log('\nSample data:');
            testQuery.rows.forEach(user => {
                console.log(`   - ${user.email}: ${user.subscription_status || 'no status'}`);
            });
        }
        console.log();

        console.log('✅ All database schema tests passed!\n');
        console.log('📝 Summary:');
        console.log('   - Subscription columns: ✅ All present');
        console.log('   - Query functionality: ✅ Working');
        console.log('   - Ready for subscriptions: ✅ Yes\n');

        return true;

    } catch (error) {
        console.error('\n❌ Database schema test failed!');
        console.error(`Error: ${error.message}\n`);

        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.error('💡 Missing database columns. Run:');
            console.error('   node add-subscription-fields.js\n');
        }

        return false;

    } finally {
        await pool.end();
    }
}

// Run the test
testDatabaseSchema()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
