/**
 * Check Stripe Subscription for Test Customer
 */
require('dotenv').config();
const stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const CUSTOMER_ID = 'cus_TEnao6S5g9JttJ'; // Test user's customer ID

async function checkSubscription() {
    try {
        const stripeClient = stripe(STRIPE_SECRET_KEY);

        console.log('\n🔍 Checking Stripe for customer:', CUSTOMER_ID, '\n');

        // Check if customer exists
        const customer = await stripeClient.customers.retrieve(CUSTOMER_ID);
        console.log('✅ Customer found:');
        console.log(`   Email: ${customer.email}`);
        console.log(`   Created: ${new Date(customer.created * 1000).toLocaleString()}\n`);

        // Check subscriptions
        const subscriptions = await stripeClient.subscriptions.list({
            customer: CUSTOMER_ID,
            limit: 10
        });

        console.log(`📋 Subscriptions: ${subscriptions.data.length} found\n`);

        if (subscriptions.data.length > 0) {
            subscriptions.data.forEach((sub, index) => {
                console.log(`Subscription ${index + 1}:`);
                console.log(`   ID: ${sub.id}`);
                console.log(`   Status: ${sub.status}`);
                console.log(`   Current period: ${new Date(sub.current_period_start * 1000).toLocaleDateString()} - ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`);

                if (sub.items && sub.items.data.length > 0) {
                    const price = sub.items.data[0].price;
                    console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}`);
                }
                console.log('');
            });
        } else {
            console.log('⚠️  No subscriptions found.');
            console.log('   This means the Stripe Checkout was not completed,');
            console.log('   or the subscription was cancelled.\n');
        }

        // Check checkout sessions
        const sessions = await stripeClient.checkout.sessions.list({
            customer: CUSTOMER_ID,
            limit: 5
        });

        console.log(`💳 Checkout Sessions: ${sessions.data.length} found\n`);

        sessions.data.forEach((session, index) => {
            console.log(`Session ${index + 1}:`);
            console.log(`   ID: ${session.id}`);
            console.log(`   Status: ${session.status}`);
            console.log(`   Payment status: ${session.payment_status}`);
            console.log(`   Subscription: ${session.subscription || 'None'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSubscription();
