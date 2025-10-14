/**
 * Delete User Inventory API
 * Deletes all inventory, images, and posts for a specific user
 * Super Admin only - for training/testing purposes
 */

const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');
const fs = require('fs').promises;
const path = require('path');

const pool = getPool();

async function handler(req, res) {
    // Check if user is super admin
    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin privileges required.'
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Verify user exists
        const userCheck = await pool.query(
            'SELECT id, email FROM users WHERE id = $1',
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userCheck.rows[0];

        // Get count of items to be deleted before deletion
        const buildingsCount = await pool.query(
            'SELECT COUNT(*) as count FROM user_inventory WHERE user_id = $1',
            [userId]
        );

        const imagesCount = await pool.query(
            'SELECT COUNT(*) as count FROM building_images WHERE user_id = $1',
            [userId]
        );

        let postsCount = { rows: [{ count: 0 }] };
        try {
            postsCount = await pool.query(
                'SELECT COUNT(*) as count FROM facebook_posts WHERE user_id = $1',
                [userId]
            );
        } catch (err) {
            console.log('[Delete Inventory] facebook_posts table may not exist, skipping count');
        }

        // Get image file paths before deleting records
        const imageFiles = await pool.query(
            'SELECT image_path FROM building_images WHERE user_id = $1',
            [userId]
        );

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Delete Facebook posts first (has foreign key to user_inventory)
            try {
                await pool.query(
                    'DELETE FROM facebook_posts WHERE user_id = $1',
                    [userId]
                );
            } catch (err) {
                console.log('[Delete Inventory] facebook_posts table may not exist, skipping');
            }

            // Delete building images
            await pool.query(
                'DELETE FROM building_images WHERE user_id = $1',
                [userId]
            );

            // Delete building overrides
            try {
                await pool.query(
                    'DELETE FROM building_overrides WHERE user_id = $1',
                    [userId]
                );
            } catch (err) {
                console.log('[Delete Inventory] building_overrides table may not exist, skipping');
            }

            // Delete image order settings
            try {
                await pool.query(
                    'DELETE FROM image_orders WHERE user_id = $1',
                    [userId]
                );
            } catch (err) {
                console.log('[Delete Inventory] image_orders table may not exist, skipping');
            }

            // Delete user inventory
            await pool.query(
                'DELETE FROM user_inventory WHERE user_id = $1',
                [userId]
            );

            // Commit transaction
            await pool.query('COMMIT');

            console.log(`[Delete Inventory] Successfully deleted inventory for user ${user.email} (ID: ${userId})`);
            console.log(`[Delete Inventory] Deleted: ${buildingsCount.rows[0].count} buildings, ${imagesCount.rows[0].count} images, ${postsCount.rows[0].count} posts`);

            // Delete image files from disk (non-blocking, errors logged but not thrown)
            deleteImageFiles(imageFiles.rows);

            return res.status(200).json({
                success: true,
                message: 'User inventory deleted successfully',
                deleted: {
                    buildings: parseInt(buildingsCount.rows[0].count),
                    images: parseInt(imagesCount.rows[0].count),
                    posts: parseInt(postsCount.rows[0].count)
                }
            });

        } catch (error) {
            // Rollback on error
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('[Delete Inventory] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete inventory',
            details: error.message
        });
    }
}

// Delete image files from disk (async, doesn't block response)
async function deleteImageFiles(imageRows) {
    if (!imageRows || imageRows.length === 0) return;

    for (const row of imageRows) {
        try {
            const imagePath = path.join(__dirname, '../../', row.image_path);
            await fs.unlink(imagePath);
            console.log(`[Delete Inventory] Deleted image file: ${row.image_path}`);
        } catch (error) {
            // Log but don't throw - file might already be deleted or not exist
            console.warn(`[Delete Inventory] Could not delete image file ${row.image_path}:`, error.message);
        }
    }
}

module.exports = requireAuth(handler);
