/**
 * User Inventory API
 * GET - Get user's inventory
 * POST - Update user's inventory
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');

const pool = getPool();

async function handler(req, res) {
    if (req.method === 'GET') {
        return getInventory(req, res);
    } else if (req.method === 'POST') {
        return updateInventory(req, res);
    } else {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
}

async function getInventory(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                serial_number as "serialNumber",
                type_code as "typeCode",
                type_name as "typeName",
                title,
                size_display as "sizeDisplay",
                width,
                length,
                date_built as "dateBuilt",
                price,
                rto36,
                rto48,
                rto60,
                rto72,
                is_repo as "isRepo",
                location,
                auto_status as "autoStatus"
             FROM user_inventory
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            inventory: result.rows
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get inventory',
            inventory: []
        });
    }
}

async function updateInventory(req, res) {
    try {
        const { inventory } = req.body;

        if (!Array.isArray(inventory)) {
            return res.status(400).json({
                success: false,
                error: 'Inventory must be an array'
            });
        }

        // Delete all existing inventory for this user
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
                    building.serialNumber || building.serial_number,
                    building.typeCode || building.type_code,
                    building.typeName || building.type_name,
                    building.title,
                    building.sizeDisplay || building.size_display,
                    building.width,
                    building.length,
                    building.dateBuilt || building.date_built,
                    building.price,
                    building.rto36,
                    building.rto48,
                    building.rto60,
                    building.rto72,
                    building.isRepo || building.is_repo || false,
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

        return res.status(200).json({
            success: true,
            message: `Updated ${inventory.length} buildings`
        });
    } catch (error) {
        console.error('Update inventory error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update inventory'
        });
    }
}

module.exports = requireAuth(handler);
