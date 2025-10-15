/**
 * Update Test User with Real Subscription Data
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateSubscription() {
    try {
        console.log('\n🔄 Updating test user subscription...\n');

        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 subscription_id = 'sub_1SIK0RAQMwdNeTYsQ0lJQlou',
                 subscription_current_period_end = NOW() + INTERVAL '1 month'
             WHERE email = 'test@testbiz.com'
             RETURNING id, email, subscription_status, subscription_id`
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Subscription updated!');
            console.log(`   Email: ${user.email}`);
            console.log(`   Status: ${user.subscription_status}`);
            console.log(`   Subscription ID: ${user.subscription_id}\n`);
            console.log('🎉 Done! Refresh the admin panel Payment Settings tab.\n');
        } else {
            console.log('❌ User not found\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateSubscription();
