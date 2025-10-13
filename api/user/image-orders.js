/**
 * Image Orders API
 * Get and update custom image ordering for buildings
 */

const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

const pool = getPool();

async function handler(req, res) {
    if (req.method === 'GET') {
        return await getImageOrders(req, res);
    } else if (req.method === 'POST' || req.method === 'PUT') {
        return await saveImageOrders(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}

async function getImageOrders(req, res) {
    try {
        const userId = req.user.id;

        // Get all image orders for this user
        const result = await pool.query(
            `SELECT serial_number, image_urls
             FROM image_orders
             WHERE user_id = $1`,
            [userId]
        );

        // Convert to object keyed by serial number (matches localStorage format)
        const orders = {};
        result.rows.forEach(row => {
            orders[row.serial_number] = row.image_urls;
        });

        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get image orders error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get image orders'
        });
    }
}

async function saveImageOrders(req, res) {
    try {
        const userId = req.user.id;
        const { orders } = req.body;

        if (!orders || typeof orders !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Orders object required'
            });
        }

        // Save each image order
        for (const [serialNumber, imageUrls] of Object.entries(orders)) {
            if (!Array.isArray(imageUrls)) continue;

            await pool.query(
                `INSERT INTO image_orders (user_id, serial_number, image_urls, updated_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, serial_number)
                 DO UPDATE SET
                    image_urls = $3,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, serialNumber, imageUrls]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Image orders saved successfully'
        });
    } catch (error) {
        console.error('Save image orders error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save image orders'
        });
    }
}

module.exports = requireAuth(handler);
