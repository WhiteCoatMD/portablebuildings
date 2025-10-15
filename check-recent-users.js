/**
 * Check Recent Users
 */
require('dotenv').config();
const { getPool } = require('./lib/db');

async function checkUsers() {
    const pool = getPool();

    try {
        const result = await pool.query(
            `SELECT id, email, business_name, subscription_status,
                    subscription_id, stripe_customer_id, created_at
             FROM users
             ORDER BY id DESC
             LIMIT 5`
        );

        console.log(`\n📋 Last 5 users (newest first):\n`);

        result.rows.forEach(user => {
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Business: ${user.business_name}`);
            console.log(`   Subscription Status: ${user.subscription_status || 'NOT SET'}`);
            console.log(`   Stripe Customer: ${user.stripe_customer_id || 'NOT SET'}`);
            console.log(`   Created: ${user.created_at}`);
            console.log('   ---');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
