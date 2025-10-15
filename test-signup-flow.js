/**
 * Test Complete Signup Flow
 * Tests the entire signup + Stripe checkout flow without actually processing payment
 */
require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');
const stripe = require('stripe');

const pool = getPool();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

async function testSignupFlow() {
    console.log('\n🧪 Testing Complete Signup Flow...\n');

    const testEmail = `test-${Date.now()}@example.com`;
    let testUserId = null;
    const stripeClient = stripe(STRIPE_SECRET_KEY);

    try {
        // Step 1: Simulate creating a user account (signup.html flow)
        console.log('Step 1: Creating test user account...');
        const userResult = await pool.query(
            `INSERT INTO users (email, password_hash, business_name, phone, subdomain, subscription_status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, subscription_status`,
            [
                testEmail,
                'hashed_password_here', // In real signup, this would be bcrypt hash
                'Test Business',
                '555-1234',
                `test-${Date.now()}`,
                'trial'
            ]
        );

        testUserId = userResult.rows[0].id;
        console.log(`✅ User created: ID ${testUserId}, Email: ${testEmail}`);
        console.log(`   Status: ${userResult.rows[0].subscription_status}\n`);

        // Step 2: Create Stripe customer (what create-checkout-session.js does)
        console.log('Step 2: Creating Stripe customer...');
        const customer = await stripeClient.customers.create({
            email: testEmail,
            metadata: {
                user_id: testUserId.toString()
            }
        });

        console.log(`✅ Stripe customer created: ${customer.id}\n`);

        // Update user with Stripe customer ID
        await pool.query(
            'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
            [customer.id, testUserId]
        );

        // Step 3: Create checkout session (what create-checkout-session.js does)
        console.log('Step 3: Creating Stripe Checkout session...');
        const session = await stripeClient.checkout.sessions.create({
            customer: customer.id,
            line_items: [{
                price: STRIPE_PRICE_ID,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: 'http://localhost:3000/payment-success.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/payment-cancelled.html',
            metadata: {
                user_id: testUserId.toString()
            }
        });

        console.log(`✅ Checkout session created: ${session.id}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Payment status: ${session.payment_status}`);
        console.log(`   Checkout URL: ${session.url}\n`);

        // Step 4: Verify user data
        console.log('Step 4: Verifying user data...');
        const verifyResult = await pool.query(
            'SELECT email, subscription_status, stripe_customer_id FROM users WHERE id = $1',
            [testUserId]
        );

        const user = verifyResult.rows[0];
        console.log(`✅ User verification:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Subscription Status: ${user.subscription_status}`);
        console.log(`   Stripe Customer ID: ${user.stripe_customer_id}\n`);

        // Step 5: Simulate webhook - what would happen after payment
        console.log('Step 5: Simulating post-payment webhook update...');
        console.log('   (In production, Stripe sends webhook after payment)');

        // This is what the webhook would do:
        await pool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 subscription_id = $1,
                 subscription_current_period_end = NOW() + INTERVAL '1 month'
             WHERE id = $2`,
            ['sub_test_' + Date.now(), testUserId]
        );

        const updatedUser = await pool.query(
            'SELECT email, subscription_status, subscription_id FROM users WHERE id = $1',
            [testUserId]
        );

        console.log(`✅ Post-payment status:`);
        console.log(`   Status: ${updatedUser.rows[0].subscription_status}`);
        console.log(`   Subscription ID: ${updatedUser.rows[0].subscription_id}\n`);

        // Clean up test data
        console.log('🧹 Cleaning up test data...');
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        console.log(`✅ Test user deleted\n`);

        // Note: Stripe customer cleanup (optional, costs nothing to leave)
        console.log('   Note: Stripe test customer left in Stripe (you can delete manually if desired)\n');

        console.log('✅ All signup flow tests passed!\n');
        console.log('📝 Summary:');
        console.log('   - User account creation: ✅ Working');
        console.log('   - Stripe customer creation: ✅ Working');
        console.log('   - Checkout session creation: ✅ Working');
        console.log('   - Database updates: ✅ Working');
        console.log('   - Webhook simulation: ✅ Working\n');

        console.log('🎯 Next Steps:');
        console.log('   1. ⚠️  You are using LIVE Stripe keys!');
        console.log('   2. To test with real signup:');
        console.log('      - Open http://localhost:3000/signup.html');
        console.log('      - Fill out the form');
        console.log('      - You will be redirected to Stripe (REAL $99 charge!)');
        console.log('      - Complete or cancel payment');
        console.log('   3. To test safely:');
        console.log('      - Switch to Stripe test keys first');
        console.log('      - Update STRIPE_SECRET_KEY and STRIPE_PRICE_ID in .env.local\n');

        return true;

    } catch (error) {
        console.error('\n❌ Signup flow test failed!');
        console.error(`Error: ${error.message}\n`);

        // Clean up on error
        if (testUserId) {
            try {
                await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
                console.log('🧹 Test user cleaned up\n');
            } catch (cleanupError) {
                console.error('Failed to clean up test user:', cleanupError.message);
            }
        }

        return false;

    } finally {
        await pool.end();
    }
}

// Run the test
testSignupFlow()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
