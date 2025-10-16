require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function findUser() {
    try {
        const result = await pool.query(
            `SELECT id, email, business_name, custom_domain, domain_verified, subdomain
             FROM users
             WHERE custom_domain ILIKE '%rankracoon%' OR subdomain ILIKE '%rankracoon%'`
        );

        if (result.rows.length === 0) {
            console.log('❌ No user found with rankracoon domain');
            console.log('\nSearching all custom domains...');

            const allDomains = await pool.query(
                `SELECT id, email, custom_domain, domain_verified
                 FROM users
                 WHERE custom_domain IS NOT NULL
                 ORDER BY id`
            );

            console.log(`\nFound ${allDomains.rows.length} users with custom domains:`);
            allDomains.rows.forEach(user => {
                console.log(`  ID ${user.id}: ${user.custom_domain} (verified: ${user.domain_verified})`);
            });
        } else {
            console.log('✅ Found user(s):');
            result.rows.forEach(user => {
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`ID: ${user.id}`);
                console.log(`Email: ${user.email}`);
                console.log(`Business: ${user.business_name}`);
                console.log(`Subdomain: ${user.subdomain || 'None'}`);
                console.log(`Custom Domain: ${user.custom_domain || 'None'}`);
                console.log(`Domain Verified: ${user.domain_verified}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

findUser();
