/**
 * Add subscription fields to users table
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function addSubscriptionFields() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        console.log('Adding subscription fields to users table...');

        // Add subscription-related columns
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP,
            ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
        `);

        console.log('✓ Subscription fields added successfully!');

        // Create indexes for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_stripe_customer
            ON users(stripe_customer_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_subscription_status
            ON users(subscription_status);
        `);

        console.log('✓ Indexes created successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

addSubscriptionFields();
