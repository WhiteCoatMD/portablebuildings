/**
 * Public Inventory API
 * Returns inventory for the website owner
 * No auth required - used by public website
 */

const { getPool } = require('../lib/db');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // For now, return the first user's inventory
        // In a multi-domain setup, you would match by domain
        const result = await pool.query(
            `SELECT
                i.serial_number as "serialNumber",
                i.type_code as "typeCode",
                i.type_name as "typeName",
                i.title,
                i.size_display as "sizeDisplay",
                i.width,
                i.length,
                i.date_built as "dateBuilt",
                i.price,
                i.rto36,
                i.rto48,
                i.rto60,
                i.rto72,
                i.is_repo as "isRepo",
                i.location,
                i.auto_status as "autoStatus"
             FROM user_inventory i
             JOIN users u ON i.user_id = u.id
             ORDER BY i.created_at DESC
             LIMIT 1000`
        );

        return res.status(200).json({
            success: true,
            inventory: result.rows
        });
    } catch (error) {
        console.error('Get public inventory error:', error);
        // Return empty inventory on error instead of failing
        return res.status(200).json({
            success: true,
            inventory: []
        });
    }
}

module.exports = handler;
