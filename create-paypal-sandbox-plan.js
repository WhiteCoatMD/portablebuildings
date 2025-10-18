/**
 * Create a PayPal Sandbox Subscription Plan
 * Run this once to generate a plan ID for testing
 */

// Temporarily disable SSL verification for local testing (ONLY for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load credentials from environment variables
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.PAYPAL_SANDBOX_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ ERROR: PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET must be set in environment variables');
    console.log('\n📝 Add these to your .env.local file:');
    console.log('   PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id_here');
    console.log('   PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret_here');
    console.log('\n🔗 Get credentials from: https://developer.paypal.com/dashboard/applications/sandbox');
    process.exit(1);
}

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Sandbox API

async function getAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
}

async function createProduct(accessToken) {
    const response = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Shed-Sync Premium Subscription',
            description: 'Premium subscription for Shed-Sync platform',
            type: 'SERVICE',
            category: 'SOFTWARE'
        })
    });

    const data = await response.json();
    console.log('✅ Product created:', data.id);
    return data.id;
}

async function createPlan(accessToken, productId) {
    const response = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            name: 'Shed-Sync Premium - Monthly',
            description: 'Monthly subscription for Shed-Sync premium features',
            billing_cycles: [
                {
                    frequency: {
                        interval_unit: 'MONTH',
                        interval_count: 1
                    },
                    tenure_type: 'REGULAR',
                    sequence: 1,
                    total_cycles: 0, // 0 = infinite
                    pricing_scheme: {
                        fixed_price: {
                            value: '99',
                            currency_code: 'USD'
                        }
                    }
                }
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee: {
                    value: '0',
                    currency_code: 'USD'
                },
                setup_fee_failure_action: 'CONTINUE',
                payment_failure_threshold: 3
            }
        })
    });

    const data = await response.json();
    console.log('\n✅ Plan created successfully!');
    console.log('📋 Plan ID:', data.id);
    console.log('\n🔧 Update admin.js line 3162 with:');
    console.log(`   plan_id: '${data.id}'`);
    return data.id;
}

async function main() {
    try {
        console.log('🚀 Creating PayPal Sandbox Subscription Plan...\n');

        if (CLIENT_SECRET === 'YOUR_SANDBOX_CLIENT_SECRET_HERE') {
            console.error('❌ ERROR: Please update CLIENT_SECRET in this file first!');
            console.log('\n📝 Get your client secret from:');
            console.log('   https://developer.paypal.com/dashboard/applications/sandbox');
            process.exit(1);
        }

        console.log('1️⃣ Getting access token...');
        const accessToken = await getAccessToken();

        console.log('2️⃣ Creating product...');
        const productId = await createProduct(accessToken);

        console.log('3️⃣ Creating subscription plan...');
        const planId = await createPlan(accessToken, productId);

        console.log('\n✨ All done! Use this Plan ID in your admin.js file.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            const errorData = await error.response.json();
            console.error('PayPal Error:', JSON.stringify(errorData, null, 2));
        }
    }
}

main();
