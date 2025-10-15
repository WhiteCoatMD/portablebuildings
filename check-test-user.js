/**
 * Check Test User Subscription Status
 */
require('dotenv').config();
const { getPool } = require('./lib/db');

async function checkUser() {
    const pool = getPool();

    try {
        const result = await pool.query(
            `SELECT id, email, business_name, subscription_status,
                    subscription_id, stripe_customer_id
             FROM users
             WHERE email = $1`,
            ['test@example.com']
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('\n✅ User found:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Business: ${user.business_name}`);
            console.log(`   Subscription Status: ${user.subscription_status || 'NOT SET'}`);
            console.log(`   Subscription ID: ${user.subscription_id || 'NOT SET'}`);
            console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'NOT SET'}`);
        } else {
            console.log('\n❌ User not found with email: test@example.com');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkUser();
