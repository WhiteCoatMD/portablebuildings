/**
 * Remove Duplicate Buildings
 * Removes older instances of duplicate serial numbers, keeping the newest
 */
const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req, res) {
    if (req.method !== 'POST') {
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

        // Find all duplicate groups
        const duplicates = await pool.query(
            `SELECT serial_number, array_agg(id ORDER BY created_at DESC) as ids
             FROM user_inventory
             WHERE user_id = $1
             GROUP BY serial_number
             HAVING COUNT(*) > 1`,
            [userId]
        );

        let removedCount = 0;
        const removedSerials = [];

        // For each duplicate group, keep the first (newest) and delete the rest
        for (const dup of duplicates.rows) {
            const idsToKeep = dup.ids.slice(0, 1); // Keep the newest
            const idsToRemove = dup.ids.slice(1); // Remove the rest

            if (idsToRemove.length > 0) {
                await pool.query(
                    `DELETE FROM user_inventory
                     WHERE id = ANY($1) AND user_id = $2`,
                    [idsToRemove, userId]
                );

                removedCount += idsToRemove.length;
                removedSerials.push({
                    serialNumber: dup.serial_number,
                    removedCount: idsToRemove.length,
                    keptId: idsToKeep[0]
                });

                console.log(`[Remove Duplicates] User ${userId}: Removed ${idsToRemove.length} duplicates of ${dup.serial_number}, kept ID ${idsToKeep[0]}`);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Removed ${removedCount} duplicate buildings`,
            removedCount,
            duplicatesProcessed: duplicates.rows.length,
            details: removedSerials
        });

    } catch (error) {
        console.error('[Remove Duplicates] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to remove duplicates',
            details: error.message
        });
    }
}

module.exports = handler;
