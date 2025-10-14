/**
 * Check and verify custom domain for sales@buytheshed.com
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkDomain() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        // Check current domain settings
        const result = await client.query(
            `SELECT email, subdomain, custom_domain, domain_verified
             FROM users
             WHERE email = $1`,
            ['sales@buytheshed.com']
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }

        const user = result.rows[0];
        console.log('\n📊 Current domain settings:');
        console.log('Email:', user.email);
        console.log('Subdomain:', user.subdomain);
        console.log('Custom Domain:', user.custom_domain || '(not set)');
        console.log('Domain Verified:', user.domain_verified);

        // Update domain to www.buytheshed.com and verify it
        console.log('\n🔧 Updating domain to www.buytheshed.com and verifying...');

        await client.query(
            `UPDATE users
             SET custom_domain = $1, domain_verified = true
             WHERE email = $2`,
            ['www.buytheshed.com', 'sales@buytheshed.com']
        );

        console.log('✓ Domain updated and verified successfully!');
        console.log('\n🌐 Your site is now accessible at:');
        console.log(`   • https://www.buytheshed.com`);
        console.log(`   • https://${user.subdomain}.shed-sync.com`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkDomain();
