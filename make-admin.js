/**
 * Make Admin Script
 * Usage: node make-admin.js your-email@example.com
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function makeAdmin(email) {
    if (!email) {
        console.error('❌ Please provide an email address');
        console.log('Usage: node make-admin.js your-email@example.com');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        console.log(`🔧 Making ${email} an admin...\n`);

        const result = await client.query(
            `UPDATE users
             SET is_admin = TRUE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE email = $1
             RETURNING id, email, is_admin, business_name`,
            [email]
        );

        if (result.rowCount === 0) {
            console.error(`❌ User not found with email: ${email}`);
            console.log('\nMake sure you:');
            console.log('1. Have created an account at /signup.html');
            console.log('2. Used the correct email address');
            process.exit(1);
        }

        console.log('✅ Success! User is now an admin:\n');
        console.log(`ID: ${result.rows[0].id}`);
        console.log(`Email: ${result.rows[0].email}`);
        console.log(`Business Name: ${result.rows[0].business_name || 'Not set'}`);
        console.log(`Admin: ${result.rows[0].is_admin}`);
        console.log('\nYou can now access the super admin dashboard at /super-admin.html');

    } catch (error) {
        console.error('❌ Failed to make user admin:', error);
        throw error;
    } finally {
        await client.end();
    }
}

const email = process.argv[2];
makeAdmin(email)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
