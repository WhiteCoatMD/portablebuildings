/**
 * User-Specific Inventory Sync
 * Syncs user's GPB Sales inventory to their database
 */

const { requireAuth } = require('../../lib/auth');
const GPBScraper = require('../../gpb-scraper');
const { getPool } = require('../../lib/db');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'GPB Sales username and password required'
        });
    }

    try {
        console.log(`Syncing inventory for user ${req.user.email}...`);

        // Scrape GPB Sales portal
        const scraper = new GPBScraper();
        scraper.config.username = username;
        scraper.config.password = password;

        const scrapedData = await scraper.run();

        if (!scrapedData || scrapedData.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No inventory found in GPB Sales portal',
                count: 0
            });
        }

        console.log(`Scraped ${scrapedData.length} buildings`);

        // Format and process inventory
        const inventory = scrapedData.map(item => {
            // Use decoder to get building details
            const SerialNumberDecoder = require('../../decoder');
            const decoder = new SerialNumberDecoder(item.serialNumber);
            const details = decoder.getFullDetails();

            if (!details.valid) {
                console.warn('Invalid serial number:', item.serialNumber);
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
                location: item.location || 'Main Lot',
                autoStatus: 'available'
            };
        }).filter(item => item !== null);

        // Delete existing inventory for this user
        await pool.query('DELETE FROM user_inventory WHERE user_id = $1', [req.user.id]);

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
                    req.user.id,
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

        console.log(`Saved ${inventory.length} buildings to database for user ${req.user.email}`);

        return res.status(200).json({
            success: true,
            message: `Successfully synced ${inventory.length} buildings`,
            count: inventory.length
        });

    } catch (error) {
        console.error('Sync error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to sync inventory'
        });
    }
}

module.exports = requireAuth(handler);
