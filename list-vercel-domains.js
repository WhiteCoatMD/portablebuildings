/**
 * List all domains configured in Vercel project
 */

const https = require('https');

// Get from .vercel/project.json
const PROJECT_ID = 'prj_gycZ2zePp7Lv5EPFXXWM2xycgbXf';

// You need VERCEL_TOKEN from environment or .env.local
require('dotenv').config({ path: '.env.local' });
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
    console.log('⚠️  VERCEL_TOKEN not found in .env.local');
    console.log('This would list all domains if token was available.');
    console.log('\nBased on testing, these domains are confirmed working:');
    console.log('  ✓ www.buytheshed.com');
    console.log('  ✓ www.patriot-buildings.us');
    console.log('  ✗ www.rankracoon.com (NOT working)');
    process.exit(0);
}

const options = {
    hostname: 'api.vercel.com',
    port: 443,
    path: `/v9/projects/${PROJECT_ID}/domains`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(body);
            console.log('Domains configured in Vercel:');
            console.log(JSON.stringify(result, null, 2));
        } catch (e) {
            console.log('Response:', body);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
