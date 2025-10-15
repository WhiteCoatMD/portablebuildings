/**
 * Check buytheshed.com domain configuration
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDomain() {
    try {
        const result = await pool.query(
            'SELECT email, subdomain, custom_domain, domain_verified FROM users WHERE email = $1',
            ['sales@buytheshed.com']
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('\n📧 User:', user.email);
            console.log('🌐 Subdomain:', user.subdomain);
            console.log('🎯 Custom Domain:', user.custom_domain);
            console.log('✅ Domain Verified:', user.domain_verified);
            console.log('');
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDomain();
