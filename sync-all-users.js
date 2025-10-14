/**
 * Multi-User Inventory Sync
 * Syncs inventory for all users who have auto-sync enabled
 * Run this with: node sync-all-users.js
 * Or set up a cron job to run it automatically
 */

const { getPool } = require('./lib/db');
const GPBScraper = require('./gpb-scraper');
const { decrypt } = require('./api/user/save-gpb-credentials');

const pool = getPool();

async function syncAllUsers() {
    console.log('=== Starting Multi-User Inventory Sync ===');
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
        // Get all users with auto-sync enabled
        const result = await pool.query(
            `SELECT id, email, gpb_username, gpb_password_encrypted, business_name
             FROM users
             WHERE auto_sync_enabled = TRUE
             AND gpb_username IS NOT NULL
             AND gpb_password_encrypted IS NOT NULL`
        );

        const users = result.rows;

        if (users.length === 0) {
            console.log('No users with auto-sync enabled');
            return;
        }

        console.log(`Found ${users.length} user(s) to sync:\n`);

        for (const user of users) {
            await syncUserInventory(user);
        }

        console.log('\n=== Sync Complete ===');

    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

async function syncUserInventory(user) {
    console.log(`\n📦 Syncing ${user.business_name || user.email}...`);

    try {
        // Decrypt password
        const password = decrypt(user.gpb_password_encrypted);

        // Scrape GPB Sales
        const scraper = new GPBScraper();
        scraper.config.username = user.gpb_username;
        scraper.config.password = password;

        console.log('  → Launching browser...');
        const scrapedData = await scraper.run();

        if (!scrapedData || scrapedData.length === 0) {
            console.log('  ⚠️  No inventory found');
            return;
        }

        console.log(`  → Scraped ${scrapedData.length} buildings`);

        // Process with decoder
        const SerialNumberDecoder = require('./decoder');
        const inventory = scrapedData.map(item => {
            const decoder = new SerialNumberDecoder(item.serialNumber);
            const details = decoder.getFullDetails();

            if (!details.valid) {
                console.warn('  ⚠️  Invalid serial:', item.serialNumber);
                return null;
            }

            return {
                serialNumber: item.serialNumber,
                typeCode: details.type.code,
                typeName: details.type.name,
                title: details.type.name,
                sizeDisplay: details.size.display,
                width: details.size.width,
                length: details.size.length,
                dateBuilt: details.dateBuilt.display,
                price: item.cashPrice || 0,
                rto36: item.rto36 || null,
                rto48: item.rto48 || null,
                rto60: item.rto60 || null,
                rto72: item.rto72 || null,
                isRepo: details.status === 'repo',
                location: item.location || 'Main Lot'
            };
        }).filter(item => item !== null);

        console.log(`  → Processed ${inventory.length} valid buildings`);

        // Delete existing inventory
        await pool.query('DELETE FROM user_inventory WHERE user_id = $1', [user.id]);

        // Insert new inventory
        if (inventory.length > 0) {
            const values = [];
            const placeholders = [];

            inventory.forEach((building, index) => {
                const offset = index * 16;
                placeholders.push(`(
                    $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
                    $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8},
                    $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12},
                    $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}
                )`);

                values.push(
                    user.id,
                    building.serialNumber,
                    building.typeCode,
                    building.typeName,
                    building.title,
                    building.sizeDisplay,
                    building.width,
                    building.length,
                    building.dateBuilt,
                    building.price,
                    building.rto36,
                    building.rto48,
                    building.rto60,
                    building.rto72,
                    building.isRepo,
                    building.location
                );
            });

            const query = `
                INSERT INTO user_inventory (
                    user_id, serial_number, type_code, type_name, title,
                    size_display, width, length, date_built, price,
                    rto36, rto48, rto60, rto72, is_repo, location
                ) VALUES ${placeholders.join(', ')}
            `;

            await pool.query(query, values);
        }

        // Update last sync time
        await pool.query(
            'UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        console.log(`  ✅ Saved ${inventory.length} buildings to database`);

    } catch (error) {
        console.error(`  ❌ Error syncing ${user.email}:`, error.message);
    }
}

// Run if called directly
if (require.main === module) {
    syncAllUsers()
        .then(() => {
            console.log('\nDone!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = syncAllUsers;
