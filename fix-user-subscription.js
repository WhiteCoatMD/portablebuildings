/**
 * Fix User Subscription
 * Manually update user with subscription ID from Stripe
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function fixUser() {
    try {
        const userId = 1;
        const subscriptionId = 'sub_1SIW00AQMwdNeTYsb8lcOYDc';

        console.log(`\n🔧 Updating user ${userId} with subscription ${subscriptionId}...\n`);

        await pool.query(
            `UPDATE users
             SET subscription_id = $1
             WHERE id = $2`,
            [subscriptionId, userId]
        );

        console.log('✅ User updated successfully!\n');

        // Verify
        const result = await pool.query(
            'SELECT id, email, subscription_status, subscription_id FROM users WHERE id = $1',
            [userId]
        );

        const user = result.rows[0];
        console.log('Updated user:');
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Status: ${user.subscription_status}`);
        console.log(`  Subscription ID: ${user.subscription_id}\n`);

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixUser();
