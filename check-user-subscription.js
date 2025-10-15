/**
 * Check User Subscription Status
 * Quick script to check a user's subscription in the database
 */

require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function checkUser(email) {
    try {
        console.log(`\n🔍 Checking subscription status for: ${email}\n`);

        const result = await pool.query(
            `SELECT id, email, business_name, subscription_status,
                    subscription_id, stripe_customer_id, trial_ends_at,
                    subscription_current_period_end, created_at
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found');
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

        // Check trial status
        if (user.subscription_status === 'trial') {
            if (user.trial_ends_at) {
                const now = new Date();
                const trialEnd = new Date(user.trial_ends_at);
                const hoursLeft = Math.max(0, Math.floor((trialEnd - now) / (1000 * 60 * 60)));

                if (trialEnd < now) {
                    console.log('\n⚠️  TRIAL EXPIRED');
                } else {
                    console.log(`\n⏰ TRIAL ACTIVE - ${hoursLeft} hours remaining`);
                }
            }
        } else if (user.subscription_status === 'active') {
            console.log('\n✅ SUBSCRIPTION ACTIVE');
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.log('Usage: node check-user-subscription.js <email>');
    console.log('Example: node check-user-subscription.js user@example.com');
    process.exit(1);
}

checkUser(email);
