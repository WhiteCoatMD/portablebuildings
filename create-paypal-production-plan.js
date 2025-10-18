/**
 * Create a PayPal PRODUCTION Subscription Plan
 * Run this once to generate a plan ID for live billing
 */

// Temporarily disable SSL verification for local testing (ONLY for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load credentials from environment variables
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ ERROR: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in environment variables');
    console.log('\n📝 Add these to your .env.local file:');
    console.log('   PAYPAL_CLIENT_ID=your_client_id_here');
    console.log('   PAYPAL_CLIENT_SECRET=your_client_secret_here');
    process.exit(1);
}

const PAYPAL_API = 'https://api-m.paypal.com'; // PRODUCTION API

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
    if (!response.ok) {
        throw new Error(`Auth failed: ${JSON.stringify(data)}`);
    }
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
            description: 'Premium subscription for Shed-Sync platform - Website hosting and inventory management',
            type: 'SERVICE',
            category: 'SOFTWARE'
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Product creation failed: ${JSON.stringify(data)}`);
    }
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
            description: 'Monthly subscription for Shed-Sync premium features - $99/month',
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
                            value: '99.00',
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
    if (!response.ok) {
        throw new Error(`Plan creation failed: ${JSON.stringify(data)}`);
    }
    console.log('\n✅ PRODUCTION Plan created successfully!');
    console.log('📋 Plan ID:', data.id);
    console.log('\n🔧 Update admin.js with these values:');
    console.log(`   Line 3140: script.src = 'https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription';`);
    console.log(`   Line 3162: plan_id: '${data.id}'`);
    console.log(`   Line 3130 & 3204: Update container IDs to: paypal-button-container-${data.id}`);
    return data;
}

async function main() {
    try {
        console.log('🚀 Creating PayPal PRODUCTION Subscription Plan...\n');
        console.log('⚠️  WARNING: This will create a REAL billing plan in production!\n');

        console.log('1️⃣ Getting access token...');
        const accessToken = await getAccessToken();
        console.log('✅ Access token obtained');

        console.log('\n2️⃣ Creating product...');
        const productId = await createProduct(accessToken);

        console.log('\n3️⃣ Creating subscription plan...');
        const plan = await createPlan(accessToken, productId);

        console.log('\n✨ All done! Your PRODUCTION plan is ready.');
        console.log('💰 You can now accept REAL payments through PayPal.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

main();
