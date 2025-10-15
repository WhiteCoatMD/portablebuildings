/**
 * Manual Domain Verification Script
 * Run this to manually verify a custom domain
 */
require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

const pool = getPool();

async function verifyDomain(email, domain) {
    try {
        console.log(`Looking up user: ${email}`);

        const userResult = await pool.query(
            'SELECT id, email, custom_domain FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log(`✓ Found user ID: ${user.id}`);
        console.log(`  Current domain: ${user.custom_domain || 'none'}`);

        // Update or set the custom domain and verify it
        await pool.query(
            `UPDATE users
             SET custom_domain = $1,
                 domain_verified = true,
                 updated_at = NOW()
             WHERE id = $2`,
            [domain.toLowerCase(), user.id]
        );

        console.log(`✓ Domain verified: ${domain}`);
        console.log(`  User: ${user.email}`);
        console.log(`  Status: VERIFIED ✓`);
        console.log(`\nThe site should now be accessible at: https://${domain}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get command line arguments
const email = process.argv[2];
const domain = process.argv[3];

if (!email || !domain) {
    console.log('Usage: node verify-domain-manual.js <email> <domain>');
    console.log('Example: node verify-domain-manual.js user@example.com allsteelselfstorage.com');
    process.exit(1);
}

verifyDomain(email, domain);
