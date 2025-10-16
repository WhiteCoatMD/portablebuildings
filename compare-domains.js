require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function compareDomains() {
    try {
        // Get patriot
        const patriot = await pool.query(
            `SELECT id, email, custom_domain, domain_verified
             FROM users
             WHERE email = 'sales@patriotbuildingsales.com'`
        );

        // Get rankracoon
        const rankracoon = await pool.query(
            `SELECT id, email, custom_domain, domain_verified
             FROM users
             WHERE email = 'mitch@whitecoat-md.com'`
        );

        console.log('PATRIOT (WORKING):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (patriot.rows[0]) {
            console.log(`Custom Domain: "${patriot.rows[0].custom_domain}"`);
            console.log(`Domain Verified: ${patriot.rows[0].domain_verified}`);
            console.log(`Length: ${patriot.rows[0].custom_domain?.length}`);
        }

        console.log('\nRANKRACOON (NOT WORKING):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (rankracoon.rows[0]) {
            console.log(`Custom Domain: "${rankracoon.rows[0].custom_domain}"`);
            console.log(`Domain Verified: ${rankracoon.rows[0].domain_verified}`);
            console.log(`Length: ${rankracoon.rows[0].custom_domain?.length}`);
        }

        // Test if API can find rankracoon
        console.log('\n\nTesting API query for rankracoon.com:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const apiTest = await pool.query(
            'SELECT id, email, custom_domain, domain_verified FROM users WHERE custom_domain = $1 AND domain_verified = true',
            ['rankracoon.com']
        );
        console.log(`Found ${apiTest.rows.length} rows`);
        if (apiTest.rows.length > 0) {
            console.log('✓ API query would find this domain');
            console.log(`  User: ${apiTest.rows[0].email}`);
        } else {
            console.log('✗ API query would NOT find this domain');
        }

        // Test www version
        console.log('\nTesting API query for www.rankracoon.com:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const wwwTest = await pool.query(
            'SELECT id, email, custom_domain, domain_verified FROM users WHERE custom_domain = $1 AND domain_verified = true',
            ['www.rankracoon.com']
        );
        console.log(`Found ${wwwTest.rows.length} rows`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

compareDomains();
