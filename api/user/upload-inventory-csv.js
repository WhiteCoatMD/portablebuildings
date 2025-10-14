/**
 * Upload Inventory from CSV
 * Allows users to upload a CSV file with their inventory
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { csvData } = req.body;

        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'CSV data required'
            });
        }

        // Parse CSV (assuming first row is headers)
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'CSV must have at least a header row and one data row'
            });
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const inventory = [];

        // Find column indexes
        const serialCol = headers.findIndex(h => h.includes('serial'));
        const priceCol = headers.findIndex(h => h.includes('price') || h.includes('cash'));
        const rto36Col = headers.findIndex(h => h.includes('36'));
        const rto48Col = headers.findIndex(h => h.includes('48'));
        const rto60Col = headers.findIndex(h => h.includes('60'));
        const rto72Col = headers.findIndex(h => h.includes('72'));
        const locationCol = headers.findIndex(h => h.includes('location'));

        if (serialCol === -1) {
            return res.status(400).json({
                success: false,
                error: 'CSV must have a "Serial Number" column'
            });
        }

        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const serialNumber = values[serialCol];

            if (!serialNumber) continue;

            // Use decoder to get building details
            try {
                const SerialNumberDecoder = require('../../decoder');
                const decoder = new SerialNumberDecoder(serialNumber);
                const details = decoder.getFullDetails();

                if (!details.valid) {
                    console.warn('Invalid serial number:', serialNumber);
                    continue;
                }

                inventory.push({
                    serialNumber: serialNumber,
                    typeCode: details.type.code,
                    typeName: details.type.name,
                    title: details.type.name,
                    sizeDisplay: details.size.display,
                    width: details.size.width,
                    length: details.size.length,
                    dateBuilt: details.dateBuilt.display,
                    price: priceCol !== -1 ? parseFloat(values[priceCol].replace(/[^0-9.]/g, '')) || 0 : 0,
                    rto36: rto36Col !== -1 ? parseFloat(values[rto36Col].replace(/[^0-9.]/g, '')) || null : null,
                    rto48: rto48Col !== -1 ? parseFloat(values[rto48Col].replace(/[^0-9.]/g, '')) || null : null,
                    rto60: rto60Col !== -1 ? parseFloat(values[rto60Col].replace(/[^0-9.]/g, '')) || null : null,
                    rto72: rto72Col !== -1 ? parseFloat(values[rto72Col].replace(/[^0-9.]/g, '')) || null : null,
                    isRepo: details.status === 'repo',
                    location: locationCol !== -1 ? values[locationCol] : 'Main Lot'
                });
            } catch (error) {
                console.error('Error processing row:', error);
                continue;
            }
        }

        if (inventory.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid buildings found in CSV'
            });
        }

        // Delete existing inventory for this user
        await pool.query('DELETE FROM user_inventory WHERE user_id = $1', [req.user.id]);

        // Insert new inventory
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

        console.log(`Uploaded ${inventory.length} buildings for user ${req.user.email}`);

        return res.status(200).json({
            success: true,
            message: `Successfully imported ${inventory.length} buildings`,
            count: inventory.length
        });

    } catch (error) {
        console.error('CSV upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload inventory'
        });
    }
}

module.exports = requireAuth(handler);
