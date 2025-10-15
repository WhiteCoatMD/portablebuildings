/**
 * Simulate Stripe Webhook - Update Test User Subscription
 * This simulates what the webhook would do in production
 */
require('dotenv').config();
const { getPool } = require('./lib/db');
const stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function simulateWebhook() {
    const pool = getPool();

    try {
        console.log('\n🔄 Simulating Stripe webhook for test user...\n');

        // Find the test user
        const userResult = await pool.query(
            `SELECT id, email, stripe_customer_id
             FROM users
             WHERE email = $1`,
            ['test@testbiz.com']
        );

        if (userResult.rows.length === 0) {
            console.error('❌ Test user not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

        if (!user.stripe_customer_id) {
            console.error('❌ User has no Stripe customer ID');
            return;
        }

        // Fetch the customer's subscriptions from Stripe
        const stripeClient = stripe(STRIPE_SECRET_KEY);
        const subscriptions = await stripeClient.subscriptions.list({
            customer: user.stripe_customer_id,
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            console.log('⚠️  No active subscriptions found in Stripe');
            console.log('   This is normal for test mode - subscription may not have been completed');
            console.log('   Creating a mock active subscription in database...\n');

            // For testing, just mark as active
            await pool.query(
                `UPDATE users
                 SET subscription_status = 'active',
                     subscription_id = $1,
                     subscription_current_period_end = NOW() + INTERVAL '1 month'
                 WHERE id = $2`,
                ['sub_test_mock_' + Date.now(), user.id]
            );

            console.log('✅ User subscription status updated to "active" (mock)');
        } else {
            const subscription = subscriptions.data[0];
            console.log(`✅ Found Stripe subscription: ${subscription.id}`);
            console.log(`   Status: ${subscription.status}`);
            console.log(`   Current period end: ${new Date(subscription.current_period_end * 1000).toLocaleString()}\n`);

            // Update database with real subscription info
            await pool.query(
                `UPDATE users
                 SET subscription_status = $1,
                     subscription_id = $2,
                     subscription_current_period_end = to_timestamp($3)
                 WHERE id = $4`,
                [
                    subscription.status,
                    subscription.id,
                    subscription.current_period_end,
                    user.id
                ]
            );

            console.log('✅ User subscription updated in database!');
        }

        // Verify the update
        const updatedUser = await pool.query(
            `SELECT email, subscription_status, subscription_id,
                    subscription_current_period_end
             FROM users
             WHERE id = $1`,
            [user.id]
        );

        const updated = updatedUser.rows[0];
        console.log('\n📋 Updated user subscription:');
        console.log(`   Email: ${updated.email}`);
        console.log(`   Status: ${updated.subscription_status}`);
        console.log(`   Subscription ID: ${updated.subscription_id}`);
        console.log(`   Period End: ${updated.subscription_current_period_end}\n`);

        console.log('🎉 Done! Refresh the admin panel to see the updated subscription.\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

simulateWebhook();
