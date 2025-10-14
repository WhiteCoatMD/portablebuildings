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

        // Upsert inventory (insert only if serial_number doesn't exist for this user)
        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const building of inventory) {
            try {
                const result = await pool.query(`
                    INSERT INTO user_inventory (
                        user_id, serial_number, type_code, type_name, title,
                        size_display, width, length, date_built, price,
                        rto36, rto48, rto60, rto72, is_repo, location
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    ON CONFLICT (user_id, serial_number)
                    DO UPDATE SET
                        type_code = EXCLUDED.type_code,
                        type_name = EXCLUDED.type_name,
                        title = EXCLUDED.title,
                        size_display = EXCLUDED.size_display,
                        width = EXCLUDED.width,
                        length = EXCLUDED.length,
                        date_built = EXCLUDED.date_built,
                        price = EXCLUDED.price,
                        rto36 = EXCLUDED.rto36,
                        rto48 = EXCLUDED.rto48,
                        rto60 = EXCLUDED.rto60,
                        rto72 = EXCLUDED.rto72,
                        is_repo = EXCLUDED.is_repo,
                        location = EXCLUDED.location,
                        updated_at = NOW()
                    WHERE user_inventory.user_id = EXCLUDED.user_id
                      AND user_inventory.serial_number = EXCLUDED.serial_number
                `, [
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
                ]);

                if (result.rowCount > 0) {
                    // Check if it was an insert or update by checking if created_at was just set
                    const check = await pool.query(
                        'SELECT created_at, updated_at FROM user_inventory WHERE user_id = $1 AND serial_number = $2',
                        [req.user.id, building.serialNumber]
                    );

                    if (check.rows.length > 0) {
                        const row = check.rows[0];
                        // If created_at and updated_at are very close (within 1 second), it's a new insert
                        const timeDiff = Math.abs(new Date(row.updated_at) - new Date(row.created_at));
                        if (timeDiff < 1000) {
                            insertedCount++;
                        } else {
                            updatedCount++;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error upserting building ${building.serialNumber}:`, error);
                skippedCount++;
            }
        }

        console.log(`Sync complete for user ${req.user.email}: ${insertedCount} new, ${updatedCount} updated, ${skippedCount} skipped`);

        return res.status(200).json({
            success: true,
            message: `Successfully synced ${inventory.length} buildings (${insertedCount} new, ${updatedCount} updated)`,
            count: inventory.length,
            inserted: insertedCount,
            updated: updatedCount,
            skipped: skippedCount
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
