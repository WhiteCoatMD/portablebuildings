/**
 * Test Stripe Configuration
 * Verifies Stripe API keys and price ID without processing any payments
 */
require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe');

async function testStripeConfig() {
    console.log('\n🧪 Testing Stripe Configuration...\n');

    // Check environment variables
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

    if (!STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY not found in .env.local');
        return false;
    }

    if (!STRIPE_PRICE_ID) {
        console.error('❌ STRIPE_PRICE_ID not found in .env.local');
        return false;
    }

    // Check if using live or test keys
    const isLiveKey = STRIPE_SECRET_KEY.startsWith('sk_live_');
    console.log(`🔑 Stripe Key Type: ${isLiveKey ? '🔴 LIVE (real payments!)' : '🟢 TEST (safe to test)'}`);
    console.log(`📋 Price ID: ${STRIPE_PRICE_ID}\n`);

    if (isLiveKey) {
        console.log('⚠️  WARNING: You are using LIVE Stripe keys!');
        console.log('⚠️  Any test signups will process REAL PAYMENTS!\n');
    }

    try {
        const stripeClient = stripe(STRIPE_SECRET_KEY);

        // Test 1: Verify API connection
        console.log('Test 1: Verifying API connection...');
        const account = await stripeClient.account.retrieve();
        console.log(`✅ Connected to Stripe account: ${account.email || account.id}`);
        console.log(`   Business name: ${account.business_profile?.name || 'Not set'}\n`);

        // Test 2: Verify price ID exists and is valid
        console.log('Test 2: Verifying price ID...');
        const price = await stripeClient.prices.retrieve(STRIPE_PRICE_ID);
        console.log(`✅ Price found: ${price.id}`);
        console.log(`   Type: ${price.type}`);
        console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
        console.log(`   Recurring: ${price.recurring ? `Every ${price.recurring.interval_count} ${price.recurring.interval}(s)` : 'No'}`);
        console.log(`   Active: ${price.active ? 'Yes' : 'No'}\n`);

        if (!price.active) {
            console.warn('⚠️  WARNING: This price is not active in Stripe!');
            console.warn('⚠️  Customers cannot subscribe to inactive prices.\n');
        }

        // Test 3: Check product details
        console.log('Test 3: Checking product details...');
        const product = await stripeClient.products.retrieve(price.product);
        console.log(`✅ Product: ${product.name}`);
        console.log(`   Description: ${product.description || 'No description'}`);
        console.log(`   Active: ${product.active ? 'Yes' : 'No'}\n`);

        // Test 4: List recent customers (just to verify read access)
        console.log('Test 4: Verifying customer access...');
        const customers = await stripeClient.customers.list({ limit: 1 });
        console.log(`✅ Customer API access verified (${customers.data.length} customers listed)\n`);

        console.log('✅ All Stripe configuration tests passed!\n');
        console.log('📝 Summary:');
        console.log(`   - API Connection: ✅ Working`);
        console.log(`   - Price ID: ✅ Valid`);
        console.log(`   - Product: ✅ ${product.name}`);
        console.log(`   - Amount: $${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval || 'one-time'}`);
        console.log(`   - Mode: ${isLiveKey ? '🔴 LIVE' : '🟢 TEST'}\n`);

        if (isLiveKey) {
            console.log('⚠️  REMINDER: You are using LIVE keys!');
            console.log('   To test safely, switch to test keys:');
            console.log('   1. Go to Stripe Dashboard → Developers → API keys');
            console.log('   2. Toggle "Test mode" in the top right');
            console.log('   3. Copy the test secret key (sk_test_...)');
            console.log('   4. Create a test price ID for the test product');
            console.log('   5. Update .env.local with test keys\n');
        }

        return true;

    } catch (error) {
        console.error('\n❌ Stripe configuration test failed!');
        console.error(`Error: ${error.message}\n`);

        if (error.type === 'StripeAuthenticationError') {
            console.error('💡 This usually means:');
            console.error('   - Invalid API key');
            console.error('   - Key was copied incorrectly');
            console.error('   - Key was revoked in Stripe Dashboard\n');
        } else if (error.type === 'StripeInvalidRequestError') {
            console.error('💡 This usually means:');
            console.error('   - Invalid price ID');
            console.error('   - Price ID doesn\'t exist');
            console.error('   - Price ID is from a different Stripe account\n');
        }

        return false;
    }
}

// Run the test
testStripeConfig()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
