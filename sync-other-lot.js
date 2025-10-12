/**
 * Sync Other Lot Script
 * Scrapes another lot's GPB Sales inventory and updates the admin overrides
 * Usage: node sync-other-lot.js <username> <password> <lot-name>
 */

const GPBScraper = require('./gpb-scraper');
const fs = require('fs').promises;
const path = require('path');

async function syncOtherLot(username, password, lotName) {
    console.log(`\n=== Syncing Lot: ${lotName} ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
        // Create a custom scraper instance with the provided credentials
        const scraper = new GPBScraper();
        scraper.config.username = username;
        scraper.config.password = password;

        console.log('\nScraping inventory from', lotName);
        const scrapedData = await scraper.run();

        if (!scrapedData || scrapedData.length === 0) {
            throw new Error('No inventory found for this lot');
        }

        console.log(`\nFound ${scrapedData.length} buildings from ${lotName}`);

        // Load current building overrides
        const adminSettingsPath = path.join(__dirname, '.claude', 'settings.local.json');
        let overrides = {};

        try {
            const content = await fs.readFile(adminSettingsPath, 'utf-8');
            const settings = JSON.parse(content);
            overrides = settings.buildingOverrides || {};
        } catch (e) {
            console.log('No existing overrides found, creating new');
        }

        // Tag each building with the lot location
        scrapedData.forEach(building => {
            if (!overrides[building.serialNumber]) {
                overrides[building.serialNumber] = {};
            }
            overrides[building.serialNumber].lotLocation = lotName;
        });

        // Save updated overrides
        const settings = {
            buildingOverrides: overrides,
            lots: await getLotsConfig(lotName, scrapedData.length)
        };

        await fs.mkdir(path.dirname(adminSettingsPath), { recursive: true });
        await fs.writeFile(adminSettingsPath, JSON.stringify(settings, null, 2));

        console.log(`\n✅ Success!`);
        console.log(`- Tagged ${scrapedData.length} buildings with location: ${lotName}`);
        console.log(`- Updated admin overrides`);
        console.log(`\nNext steps:`);
        console.log(`1. Commit and push changes`);
        console.log(`2. Deploy to Vercel`);
        console.log(`3. Buildings will show with 📍 ${lotName} badge in admin`);

        return {
            success: true,
            count: scrapedData.length,
            lotName
        };

    } catch (error) {
        console.error('\n❌ Sync Failed');
        console.error('Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function getLotsConfig(lotName, buildingCount) {
    // Update the lots configuration
    const adminSettingsPath = path.join(__dirname, '.claude', 'settings.local.json');
    let lots = [];

    try {
        const content = await fs.readFile(adminSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        lots = settings.lots || [];
    } catch (e) {
        // No existing settings
    }

    // Update or add this lot
    const existingLot = lots.find(l => l.name === lotName);
    if (existingLot) {
        existingLot.lastSync = new Date().toISOString();
        existingLot.buildingCount = buildingCount;
    } else {
        lots.push({
            name: lotName,
            lastSync: new Date().toISOString(),
            buildingCount
        });
    }

    return lots;
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Usage: node sync-other-lot.js <username> <password> <lot-name>');
        console.error('Example: node sync-other-lot.js john@example.com password123 "Columbia, LA"');
        process.exit(1);
    }

    const [username, password, lotName] = args;

    syncOtherLot(username, password, lotName).then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = syncOtherLot;
