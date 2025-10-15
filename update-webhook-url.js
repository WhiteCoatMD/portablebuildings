/**
 * Update Stripe Webhook URL
 * Updates the webhook to point to the latest production deployment
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get the new URL from command line argument
const newUrl = process.argv[2];

if (!newUrl) {
    console.log('Usage: node update-webhook-url.js <new-webhook-url>');
    console.log('Example: node update-webhook-url.js https://portablebuildings-xyz.vercel.app/api/subscription/webhook');
    process.exit(1);
}

async function updateWebhook() {
    try {
        console.log('🔧 Updating Stripe webhook URL...\n');

        // Find existing webhook
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        const existing = webhooks.data.find(wh =>
            wh.url.includes('/api/subscription/webhook')
        );

        if (!existing) {
            console.log('❌ No webhook endpoint found!');
            console.log('   Run: node setup-stripe-webhook.js');
            return;
        }

        console.log(`Current URL: ${existing.url}`);
        console.log(`New URL:     ${newUrl}\n`);

        // Update the webhook URL
        const updated = await stripe.webhookEndpoints.update(existing.id, {
            url: newUrl
        });

        console.log('✅ Webhook URL updated successfully!\n');
        console.log(`Webhook ID: ${updated.id}`);
        console.log(`Status: ${updated.status}`);
        console.log(`New URL: ${updated.url}`);
        console.log(`\n🔑 Signing Secret (unchanged): ${updated.secret}`);
        console.log('\n💡 The webhook secret remains the same, so no Vercel changes needed.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateWebhook();
