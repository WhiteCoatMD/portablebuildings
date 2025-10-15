/**
 * Manually Activate User Subscription
 * For testing when Stripe blocks the account
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function activateUser(email) {
    try {
        console.log(`\n🔧 Manually activating subscription for: ${email}\n`);

        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 subscription_plan = 'monthly',
                 trial_ends_at = NULL,
                 subscription_current_period_end = NOW() + INTERVAL '30 days'
             WHERE email = $1
             RETURNING id, email, subscription_status, subscription_plan, subscription_current_period_end`,
            [email]
        );

        if (result.rowCount === 0) {
            console.log('❌ User not found with email:', email);
            await pool.end();
            return;
        }

        const user = result.rows[0];

        console.log('✅ User subscription activated!\n');
        console.log('📊 Updated User:');
        console.log('━'.repeat(70));
        console.log(`ID:                  ${user.id}`);
        console.log(`Email:               ${user.email}`);
        console.log(`Subscription Status: ${user.subscription_status}`);
        console.log(`Subscription Plan:   ${user.subscription_plan}`);
        console.log(`Next Billing:        ${new Date(user.subscription_current_period_end).toLocaleDateString()}`);
        console.log('━'.repeat(70));
        console.log('\n💡 User can now access all premium features!\n');

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.log('Usage: node manually-activate-user.js <email>');
    console.log('Example: node manually-activate-user.js test@example.com');
    process.exit(1);
}

activateUser(email);
