/**
 * Create payment transactions table
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function createPaymentTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        console.log('Creating payment_transactions table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                building_id INTEGER NOT NULL,
                payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_type VARCHAR(50) NOT NULL DEFAULT 'full',
                customer_email VARCHAR(255) NOT NULL,
                customer_name VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✓ payment_transactions table created successfully!');

        // Create index for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_intent
            ON payment_transactions(payment_intent_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_user_payments
            ON payment_transactions(user_id, created_at DESC);
        `);

        console.log('✓ Indexes created successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

createPaymentTables();
