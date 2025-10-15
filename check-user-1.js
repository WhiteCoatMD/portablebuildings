/**
 * Check User 1
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function checkUser() {
    try {
        console.log(`\n🔍 Checking user ID: 1\n`);

        const result = await pool.query(
            `SELECT id, email, business_name, subscription_status,
                    subscription_id, stripe_customer_id, trial_ends_at,
                    subscription_current_period_end, created_at
             FROM users
             WHERE id = $1`,
            [1]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found');
            await pool.end();
            return;
        }

        const user = result.rows[0];

        console.log('📊 User Details:');
        console.log('━'.repeat(70));
        console.log(`ID:                  ${user.id}`);
        console.log(`Email:               ${user.email}`);
        console.log(`Business Name:       ${user.business_name || 'N/A'}`);
        console.log(`Subscription Status: ${user.subscription_status}`);
        console.log(`Subscription ID:     ${user.subscription_id || 'None'}`);
        console.log(`Stripe Customer ID:  ${user.stripe_customer_id || 'None'}`);
        console.log(`Trial Ends At:       ${user.trial_ends_at || 'N/A'}`);
        console.log(`Current Period End:  ${user.subscription_current_period_end || 'N/A'}`);
        console.log(`Created At:          ${user.created_at}`);
        console.log('━'.repeat(70));

        // Check if subscription matches what Stripe sent
        const expectedSub = 'sub_1SIW00AQMwdNeTYsb8lcOYDc';
        const expectedCustomer = 'cus_TEzzE1utkNkZs2';

        if (user.subscription_id === expectedSub) {
            console.log('\n✅ Subscription ID matches Stripe event');
        } else {
            console.log(`\n⚠️  Subscription ID mismatch!`);
            console.log(`   Expected: ${expectedSub}`);
            console.log(`   Database: ${user.subscription_id || 'None'}`);
        }

        if (user.stripe_customer_id === expectedCustomer) {
            console.log('✅ Customer ID matches Stripe event');
        } else {
            console.log(`⚠️  Customer ID mismatch!`);
            console.log(`   Expected: ${expectedCustomer}`);
            console.log(`   Database: ${user.stripe_customer_id || 'None'}`);
        }

        if (user.subscription_status === 'active') {
            console.log('✅ Status is ACTIVE\n');
        } else {
            console.log(`⚠️  Status is: ${user.subscription_status}\n`);
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUser();
