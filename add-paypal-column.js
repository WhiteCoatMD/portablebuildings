/**
 * Add PayPal Subscription Column
 * Adds paypal_subscription_id column to users table
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function addPayPalColumn() {
    try {
        console.log('🔧 Adding paypal_subscription_id column to users table...\n');

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255)
        `);

        console.log('✅ Column added successfully!\n');

        // Verify
        const result = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'paypal_subscription_id'
        `);

        if (result.rows.length > 0) {
            console.log('Verified column exists:');
            console.log(`  Name: ${result.rows[0].column_name}`);
            console.log(`  Type: ${result.rows[0].data_type}\n`);
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addPayPalColumn();
