/**
 * Update patriot-buildings.us to www.patriot-buildings.us
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateDomain() {
    try {
        const result = await pool.query(`
            UPDATE users
            SET custom_domain = 'www.patriot-buildings.us'
            WHERE email = 'sales@patriotbuildingsales.com'
            RETURNING id, email, custom_domain, domain_verified
        `);

        console.log('✅ Domain updated successfully:');
        console.log(JSON.stringify(result.rows[0], null, 2));
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateDomain();
