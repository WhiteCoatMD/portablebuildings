require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listDomains() {
    try {
        const result = await pool.query(
            `SELECT id, email, business_name, custom_domain, domain_verified, created_at
             FROM users
             WHERE custom_domain IS NOT NULL
             ORDER BY created_at ASC`
        );

        console.log(`Found ${result.rows.length} users with custom domains:\n`);

        for (const user of result.rows) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`ID: ${user.id} | ${user.business_name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Domain: ${user.custom_domain}`);
            console.log(`Verified: ${user.domain_verified}`);
            console.log(`Created: ${user.created_at}`);

            // Test if domain works
            const testDomain = user.custom_domain;
            console.log(`Testing ${testDomain}...`);

            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

listDomains();
