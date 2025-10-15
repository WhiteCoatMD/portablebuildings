/**
 * Get Webhook Secret
 * Retrieves the signing secret for the webhook endpoint
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function getWebhookSecret() {
    try {
        console.log('🔍 Getting webhook secret...\n');

        // Get all webhooks
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

        console.log(`Found ${webhooks.data.length} webhook(s):\n`);

        for (const wh of webhooks.data) {
            console.log(`Webhook ID: ${wh.id}`);
            console.log(`URL: ${wh.url}`);
            console.log(`Status: ${wh.status}`);
            console.log(`Secret: ${wh.secret}`);
            console.log('─'.repeat(70));
            console.log('');
        }

        // Find the one we're using
        const webhook = webhooks.data.find(wh =>
            wh.url.includes('/api/subscription/webhook')
        );

        if (webhook) {
            console.log('\n🔑 CURRENT WEBHOOK SECRET:');
            console.log(`   ${webhook.secret}\n`);
            console.log('📋 Update Vercel:');
            console.log(`   vercel env rm STRIPE_WEBHOOK_SECRET production`);
            console.log(`   echo "${webhook.secret}" | vercel env add STRIPE_WEBHOOK_SECRET production\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getWebhookSecret();
