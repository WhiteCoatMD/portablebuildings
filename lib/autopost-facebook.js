/**
 * Facebook Auto-posting Module
 * Handles automatic posting of buildings to Facebook based on schedule settings
 */

const { getPool } = require('./db');
const { addToPostQueue, canPostToday } = require('./post-scheduler');

const pool = getPool();

/**
 * Auto-post a building to Facebook (adds to queue or posts immediately based on schedule)
 * @param {number} userId - User ID
 * @param {object} building - Building data
 * @param {object} userSettings - User's settings from database
 */
async function autoPostToFacebook(userId, building, userSettings = {}) {
    try {
        console.log(`[Facebook Autopost] Processing ${building.serialNumber} for user ${userId}`);

        // Check if Facebook auto-posting is enabled
        const fbConnection = await pool.query(
            `SELECT * FROM facebook_connections WHERE user_id = $1 AND is_active = true`,
            [userId]
        );

        if (fbConnection.rows.length === 0) {
            console.log(`[Facebook Autopost] User ${userId} has no active Facebook connection`);
            return { success: false, reason: 'No active Facebook connection' };
        }

        // Get Facebook auto-post settings
        const settings = userSettings.settings || {};
        const enableAutoPost = settings.enableAutoPost || false;
        const autoPostNewOnly = settings.autoPostNewOnly !== false; // default true
        const autoPostWithImages = settings.autoPostWithImages !== false; // default true
        const autoPostAvailableOnly = settings.autoPostAvailableOnly !== false; // default true
        const facebookSchedule = settings.facebookSchedule || {};

        if (!enableAutoPost) {
            console.log(`[Facebook Autopost] Auto-posting is disabled for user ${userId}`);
            return { success: false, reason: 'Auto-posting disabled' };
        }

        // Check if building meets auto-post conditions
        if (autoPostWithImages && (!building.images || building.images.length === 0)) {
            console.log(`[Facebook Autopost] Skipping ${building.serialNumber} - no images`);
            return { success: false, reason: 'No images' };
        }

        if (autoPostAvailableOnly && building.autoStatus !== 'available') {
            console.log(`[Facebook Autopost] Skipping ${building.serialNumber} - not available (status: ${building.autoStatus})`);
            return { success: false, reason: 'Not available' };
        }

        // Get schedule settings
        const postFrequency = facebookSchedule.postFrequency || 'immediate';

        // If immediate posting and no daily limit, post now
        if (postFrequency === 'immediate') {
            const maxPostsPerDay = facebookSchedule.maxPostsPerDay || 'unlimited';
            const canPost = await canPostToday(userId, maxPostsPerDay);

            if (!canPost) {
                console.log(`[Facebook Autopost] Daily limit reached for user ${userId}, adding to queue`);
                // Add to queue for tomorrow
                const result = await addToPostQueue(userId, building, facebookSchedule);
                return result;
            }

            // Post immediately (still need to implement direct posting)
            console.log(`[Facebook Autopost] Would post immediately: ${building.serialNumber}`);
            // For now, add to queue with scheduled_time = NOW
            const result = await addToPostQueue(userId, building, { ...facebookSchedule, postFrequency: 'immediate' });
            return result;
        }

        // For scheduled posting, add to queue
        console.log(`[Facebook Autopost] Adding ${building.serialNumber} to post queue (${postFrequency})`);
        const result = await addToPostQueue(userId, building, facebookSchedule);
        return result;

    } catch (error) {
        console.error(`[Facebook Autopost] Error for ${building.serialNumber}:`, error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    autoPostToFacebook
};
