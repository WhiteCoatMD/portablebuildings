require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDomain() {
    try {
        const result = await pool.query(
            `SELECT id, email, business_name, custom_domain, domain_verified, subdomain, created_at
             FROM users
             WHERE custom_domain ILIKE '%patriot%'`
        );

        console.log(`Found ${result.rows.length} user(s):\n`);
        result.rows.forEach(user => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Business: ${user.business_name}`);
            console.log(`Subdomain: ${user.subdomain || 'None'}`);
            console.log(`Custom Domain: ${user.custom_domain}`);
            console.log(`Domain Verified: ${user.domain_verified}`);
            console.log(`Created At: ${user.created_at}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

        // Compare with rankracoon
        const rankracoon = await pool.query(
            `SELECT id, email, business_name, custom_domain, domain_verified, subdomain, created_at
             FROM users
             WHERE custom_domain = 'rankracoon.com'`
        );

        if (rankracoon.rows.length > 0) {
            console.log('\nRankracoon comparison:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const user = rankracoon.rows[0];
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Custom Domain: ${user.custom_domain}`);
            console.log(`Domain Verified: ${user.domain_verified}`);
            console.log(`Created At: ${user.created_at}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDomain();
