/**
 * Check for Duplicate Buildings
 * Finds buildings with duplicate serial numbers in user's inventory
 */
const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No authorization token provided'
        });
    }

    const token = authHeader.substring(7);

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Find duplicate serial numbers in this user's inventory
        const duplicates = await pool.query(
            `SELECT serial_number, COUNT(*) as count,
                    array_agg(id) as ids,
                    array_agg(created_at) as created_dates
             FROM user_inventory
             WHERE user_id = $1
             GROUP BY serial_number
             HAVING COUNT(*) > 1
             ORDER BY COUNT(*) DESC, serial_number`,
            [userId]
        );

        // Get details for each duplicate
        const duplicateDetails = await Promise.all(
            duplicates.rows.map(async (dup) => {
                const details = await pool.query(
                    `SELECT id, serial_number, title, size_display, price, created_at
                     FROM user_inventory
                     WHERE user_id = $1 AND serial_number = $2
                     ORDER BY created_at DESC`,
                    [userId, dup.serial_number]
                );

                return {
                    serialNumber: dup.serial_number,
                    count: parseInt(dup.count),
                    instances: details.rows
                };
            })
        );

        return res.status(200).json({
            success: true,
            duplicates: duplicateDetails,
            totalDuplicates: duplicates.rows.length,
            totalExtraBuildings: duplicates.rows.reduce((sum, dup) => sum + (parseInt(dup.count) - 1), 0)
        });

    } catch (error) {
        console.error('[Check Duplicates] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to check for duplicates',
            details: error.message
        });
    }
}

module.exports = handler;
