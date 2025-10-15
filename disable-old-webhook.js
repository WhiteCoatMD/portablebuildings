/**
 * Disable Old Webhook
 * Disables the webhook pointing to old deployment
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function disableOldWebhook() {
    try {
        console.log('🔧 Disabling old webhook...\n');

        const webhookId = 'we_1SIUnZAQMwdNeTYsbtouFwnU';

        // Delete the webhook
        await stripe.webhookEndpoints.del(webhookId);

        console.log(`✅ Webhook ${webhookId} deleted successfully!\n`);
        console.log('Remaining webhooks:');

        // List remaining webhooks
        const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        for (const wh of webhooks.data) {
            console.log(`  - ${wh.id}: ${wh.url} (${wh.status})`);
        }
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

disableOldWebhook();
