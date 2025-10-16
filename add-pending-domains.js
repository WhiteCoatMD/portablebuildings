/**
 * Add all custom domains from database to Vercel
 * This should be run after dealers save new domains
 *
 * Usage: node add-pending-domains.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { execSync } = require('child_process');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addPendingDomains() {
    try {
        console.log('🔍 Checking for custom domains in database...\n');

        const result = await pool.query(
            `SELECT id, email, business_name, custom_domain, domain_verified
             FROM users
             WHERE custom_domain IS NOT NULL
             ORDER BY id`
        );

        if (result.rows.length === 0) {
            console.log('No custom domains found.');
            return;
        }

        console.log(`Found ${result.rows.length} domain(s):\n`);

        for (const user of result.rows) {
            const domain = user.custom_domain;
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Domain: ${domain}`);
            console.log(`User: ${user.email} (${user.business_name})`);
            console.log(`Verified: ${user.domain_verified}`);

            // Extract root domain and www domain
            const rootDomain = domain.startsWith('www.') ? domain.substring(4) : domain;
            const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`;

            // Add root domain
            try {
                console.log(`\n  Adding root domain: ${rootDomain}...`);
                const output = execSync(`vercel domains add ${rootDomain}`, {
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });

                if (output.includes('Success') || output.includes('already') || output.includes('exists')) {
                    console.log(`  ✅ ${rootDomain} - Added or already exists`);
                } else {
                    console.log(`  ⚠️  ${rootDomain} - ${output.trim()}`);
                }
            } catch (error) {
                const errorMsg = error.stderr || error.message;
                if (errorMsg.includes('already') || errorMsg.includes('Success')) {
                    console.log(`  ✅ ${rootDomain} - Already exists`);
                } else {
                    console.log(`  ❌ ${rootDomain} - Error: ${errorMsg.split('\n')[0]}`);
                }
            }

            // Add www subdomain
            if (rootDomain !== wwwDomain) {
                try {
                    console.log(`  Adding www subdomain: ${wwwDomain}...`);
                    const output = execSync(`vercel domains add ${wwwDomain}`, {
                        encoding: 'utf-8',
                        stdio: 'pipe'
                    });

                    if (output.includes('Success') || output.includes('already') || output.includes('exists')) {
                        console.log(`  ✅ ${wwwDomain} - Added or already exists`);
                    } else {
                        console.log(`  ⚠️  ${wwwDomain} - ${output.trim()}`);
                    }
                } catch (error) {
                    const errorMsg = error.stderr || error.message;
                    if (errorMsg.includes('already') || errorMsg.includes('Success')) {
                        console.log(`  ✅ ${wwwDomain} - Already exists`);
                    } else {
                        console.log(`  ❌ ${wwwDomain} - Error: ${errorMsg.split('\n')[0]}`);
                    }
                }
            }

            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ All domains processed!');
        console.log('\n💡 Tip: Run this script whenever dealers add new custom domains.');
        console.log('   Or set up a cron job to run it periodically.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

addPendingDomains();
