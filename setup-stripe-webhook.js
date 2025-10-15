/**
 * Stripe Webhook Setup Script
 * Automatically creates webhook endpoint in Stripe
 */

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_URL = 'https://portablebuildings-4dvo2a3ty-mitch-brattons-projects.vercel.app/api/subscription/webhook';

const EVENTS_TO_LISTEN = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
];

async function setupWebhook() {
    try {
        console.log('🔧 Setting up Stripe webhook...\n');
        console.log(`Webhook URL: ${WEBHOOK_URL}`);
        console.log(`Events: ${EVENTS_TO_LISTEN.join(', ')}\n`);

        // Check if webhook already exists
        const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        const existing = existingWebhooks.data.find(wh => wh.url === WEBHOOK_URL);

        if (existing) {
            console.log('⚠️  Webhook endpoint already exists!');
            console.log(`   ID: ${existing.id}`);
            console.log(`   Status: ${existing.status}`);
            console.log(`   Events: ${existing.enabled_events.join(', ')}`);
            console.log(`\n🔑 Signing Secret: ${existing.secret}\n`);

            const answer = await question('Update existing webhook? (y/n): ');
            if (answer.toLowerCase() !== 'y') {
                console.log('Aborted.');
                return;
            }

            // Update existing webhook
            const updated = await stripe.webhookEndpoints.update(existing.id, {
                enabled_events: EVENTS_TO_LISTEN
            });

            console.log('\n✅ Webhook updated successfully!');
            console.log(`\n🔑 Signing Secret (save this to Vercel):`);
            console.log(`   ${existing.secret}\n`);

            showNextSteps(existing.secret);
            return;
        }

        // Create new webhook
        const webhook = await stripe.webhookEndpoints.create({
            url: WEBHOOK_URL,
            enabled_events: EVENTS_TO_LISTEN,
            description: 'Shed Sync Subscription Webhook'
        });

        console.log('✅ Webhook created successfully!\n');
        console.log(`Webhook ID: ${webhook.id}`);
        console.log(`Status: ${webhook.status}`);
        console.log(`\n🔑 Signing Secret (IMPORTANT - save this!):`);
        console.log(`   ${webhook.secret}\n`);

        showNextSteps(webhook.secret);

    } catch (error) {
        console.error('❌ Error setting up webhook:', error.message);

        if (error.type === 'StripeAuthenticationError') {
            console.log('\n⚠️  Make sure STRIPE_SECRET_KEY is set in .env.local');
        }

        process.exit(1);
    }
}

function showNextSteps(secret) {
    console.log('━'.repeat(70));
    console.log('📋 NEXT STEPS:');
    console.log('━'.repeat(70));
    console.log('\n1. Add this secret to Vercel:');
    console.log('   - Go to https://vercel.com/dashboard');
    console.log('   - Select your project: portablebuildings');
    console.log('   - Go to Settings → Environment Variables');
    console.log('   - Add new variable:');
    console.log(`     Name: STRIPE_WEBHOOK_SECRET`);
    console.log(`     Value: ${secret}`);
    console.log('     Environments: All (Production, Preview, Development)');
    console.log('   - Click Save');
    console.log('\n2. Redeploy your project:');
    console.log('   - Go to Deployments tab');
    console.log('   - Click ⋯ menu on latest deployment');
    console.log('   - Click "Redeploy"');
    console.log('\n3. Test the webhook:');
    console.log('   - Create a test signup');
    console.log('   - Complete payment with test card: 4242 4242 4242 4242');
    console.log('   - Check Stripe Dashboard → Webhooks → View logs');
    console.log('   - Verify events return status 200');
    console.log('\n━'.repeat(70));
    console.log('\n💡 TIP: Save this secret somewhere safe! You\'ll need it if you');
    console.log('   ever need to reconfigure the webhook.');
    console.log('\n');
}

// Simple question helper
function question(prompt) {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        readline.question(prompt, (answer) => {
            readline.close();
            resolve(answer);
        });
    });
}

// Run the setup
setupWebhook();
