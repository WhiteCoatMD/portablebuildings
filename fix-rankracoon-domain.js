require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixDomain() {
    try {
        console.log('Updating rankracoon.com to www.rankracoon.com...\n');

        const result = await pool.query(
            `UPDATE users
             SET custom_domain = 'www.rankracoon.com',
                 updated_at = NOW()
             WHERE custom_domain = 'rankracoon.com'
             RETURNING id, email, custom_domain, domain_verified`
        );

        if (result.rows.length > 0) {
            console.log('✅ Domain updated successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`User: ${result.rows[0].email}`);
            console.log(`New Domain: ${result.rows[0].custom_domain}`);
            console.log(`Verified: ${result.rows[0].domain_verified}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            console.log('⚠️  No rows updated');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixDomain();
