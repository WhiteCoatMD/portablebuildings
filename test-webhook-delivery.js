/**
 * Test Webhook Delivery
 * Checks recent webhook event deliveries from Stripe
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkWebhookDelivery() {
    try {
        console.log('🔍 Checking webhook event deliveries...\n');

        // Get the webhook endpoint
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        const webhook = webhooks.data.find(wh =>
            wh.url.includes('/api/subscription/webhook')
        );

        if (!webhook) {
            console.log('❌ No webhook endpoint found!');
            return;
        }

        console.log(`✅ Webhook: ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Status: ${webhook.status}\n`);

        // Get recent events
        console.log('📊 Recent Events:\n');
        const events = await stripe.events.list({ limit: 10 });

        if (events.data.length === 0) {
            console.log('   No recent events found');
            return;
        }

        for (const event of events.data) {
            console.log(`Event: ${event.type}`);
            console.log(`  ID: ${event.id}`);
            console.log(`  Created: ${new Date(event.created * 1000).toLocaleString()}`);

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                console.log(`  Customer: ${session.customer}`);
                console.log(`  Subscription: ${session.subscription}`);
                console.log(`  User ID (metadata): ${session.metadata?.user_id || 'N/A'}`);
            }
            console.log('');
        }

        console.log('\n💡 To see webhook delivery attempts:');
        console.log('   1. Go to https://dashboard.stripe.com/test/webhooks');
        console.log(`   2. Click on webhook: ${webhook.id}`);
        console.log('   3. Go to "Events & logs" tab');
        console.log('   4. Check if events show status 200 (success) or error\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkWebhookDelivery();
