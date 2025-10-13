/**
 * Add environment variables to Vercel via API
 * Run with: node add-env-vars.js
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

async function addEnvVar(name, value, environments) {
    console.log(`Adding ${name} to ${environments.join(', ')}...`);

    for (const env of environments) {
        try {
            // Remove if exists
            try {
                execSync(`vercel env rm ${name} ${env} --yes`, { stdio: 'pipe' });
                console.log(`  Removed existing ${name} from ${env}`);
            } catch (e) {
                // Doesn't exist, that's fine
            }

            // Add new value
            execSync(`echo "${value}" | vercel env add ${name} ${env}`, { stdio: 'inherit' });
            console.log(`  ✓ Added ${name} to ${env}`);
        } catch (error) {
            console.error(`  ✗ Failed to add ${name} to ${env}:`, error.message);
        }
    }
}

async function main() {
    const environments = ['production', 'preview', 'development'];

    const vars = [
        { name: 'POSTGRES_URL', value: process.env.POSTGRES_URL },
        { name: 'DATABASE_URL', value: process.env.DATABASE_URL || process.env.POSTGRES_URL },
        { name: 'JWT_SECRET', value: process.env.JWT_SECRET }
    ];

    for (const { name, value } of vars) {
        if (!value) {
            console.log(`⚠️  Skipping ${name} - not found in .env.local`);
            continue;
        }
        await addEnvVar(name, value, environments);
    }

    console.log('\n✅ Done! Now redeploy your app:');
    console.log('   vercel --prod');
}

main().catch(console.error);
