/**
 * Add Custom Domain to Vercel Project via API
 * Usage: node add-domain-to-vercel.js domain.com
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const domain = process.argv[2];

if (!domain) {
    console.error('❌ Usage: node add-domain-to-vercel.js domain.com');
    console.error('Example: node add-domain-to-vercel.js allsteelselfstorage.com');
    process.exit(1);
}

// You need to set these environment variables
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN || !PROJECT_ID) {
    console.error('❌ Missing environment variables!');
    console.error('Set VERCEL_TOKEN and VERCEL_PROJECT_ID in .env.local');
    console.error('\nTo get VERCEL_TOKEN:');
    console.error('1. Go to https://vercel.com/account/tokens');
    console.error('2. Create a new token');
    console.error('3. Add to .env.local: VERCEL_TOKEN=your_token_here');
    console.error('\nTo get VERCEL_PROJECT_ID:');
    console.error('1. Go to your project settings in Vercel');
    console.error('2. Find the project ID');
    console.error('3. Add to .env.local: VERCEL_PROJECT_ID=your_project_id');
    process.exit(1);
}

async function addDomain(domainName) {
    const data = JSON.stringify({ name: domainName });

    const options = {
        hostname: 'api.vercel.com',
        port: 443,
        path: `/v9/projects/${PROJECT_ID}/domains`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        console.log(`✅ Added ${domainName} to Vercel`);
                        resolve(result);
                    } else if (res.statusCode === 409) {
                        console.log(`⚠️  ${domainName} already exists in Vercel`);
                        resolve(result);
                    } else {
                        console.error(`❌ Failed to add ${domainName} (${res.statusCode}):`, body);
                        reject(new Error(body));
                    }
                } catch (e) {
                    console.error(`❌ Failed to parse response:`, body);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Request error:`, error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log(`\n🚀 Adding ${domain} to Vercel project...\n`);

    try {
        // Add root domain
        await addDomain(domain);

        // Add www subdomain
        await addDomain(`www.${domain}`);

        console.log('\n✅ Domain configuration complete!');
        console.log('📋 Next steps:');
        console.log(`   1. SSL certificate will be automatically provisioned`);
        console.log(`   2. Make sure DNS is configured:`);
        console.log(`      - A Record: @ → 76.76.21.93`);
        console.log(`      - CNAME: www → cname.vercel-dns.com`);
        console.log(`   3. Site should be live at https://${domain} in ~1 minute`);
        console.log(`   4. Check status: curl -I https://${domain}`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('- Check that VERCEL_TOKEN is valid');
        console.error('- Check that VERCEL_PROJECT_ID is correct');
        console.error('- Try adding domain manually via Vercel dashboard');
        process.exit(1);
    }
}

run();
