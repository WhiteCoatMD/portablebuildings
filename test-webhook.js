/**
 * Test Stripe Webhook
 * Sends a test event to verify webhook is working
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
    try {
        console.log('🧪 Testing Stripe webhook...\n');

        // Get the webhook endpoint
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        const webhook = webhooks.data.find(wh =>
            wh.url.includes('/api/subscription/webhook')
        );

        if (!webhook) {
            console.log('❌ No webhook endpoint found!');
            console.log('   Run: node setup-stripe-webhook.js');
            return;
        }

        console.log(`✅ Webhook found: ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Status: ${webhook.status}\n`);

        // Send a test event
        console.log('📤 Sending test event to webhook...');

        const testEvent = await stripe.events.create({
            type: 'customer.subscription.created',
            data: {
                object: {
                    id: 'sub_test_123',
                    customer: 'cus_test_123',
                    status: 'active',
                    metadata: {
                        user_id: '1'
                    }
                }
            }
        });

        console.log(`✅ Test event created: ${testEvent.id}\n`);
        console.log('🔍 Check webhook delivery:');
        console.log('   1. Go to https://dashboard.stripe.com/test/webhooks');
        console.log(`   2. Click on webhook: ${webhook.id}`);
        console.log('   3. Go to "Events & logs" tab');
        console.log('   4. Look for the test event');
        console.log('   5. Verify it shows status 200 (success)\n');

        console.log('💡 Or check Vercel logs:');
        console.log('   vercel logs --follow\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testWebhook();
