/**
 * Check custom domain configurations
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDomains() {
    try {
        const result = await pool.query(`
            SELECT id, email, subdomain, custom_domain,
                   features->>'custom_domain_verified' as verified
            FROM users
            WHERE custom_domain IS NOT NULL AND custom_domain != ''
        `);

        console.log('Users with custom domains:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDomains();
