/**
 * Facebook Post Queue Processor
 * Processes pending posts from the queue and publishes them to Facebook
 * This endpoint should be called by Vercel cron job every 15 minutes
 */

const { getPool } = require('../../lib/db');
const { canPostToday } = require('../../lib/post-scheduler');
const { selectBestTemplate, recordTemplateUsage } = require('../../lib/template-selector');

const pool = getPool();

module.exports = async (req, res) => {
    try {
        console.log('[Queue Processor] Starting queue processing...');

        // Get all pending posts that are due to be posted
        const duePostsResult = await pool.query(
            `SELECT * FROM facebook_post_queue
             WHERE status = 'pending'
             AND scheduled_time <= NOW()
             ORDER BY scheduled_time ASC
             LIMIT 50`
        );

        const duePosts = duePostsResult.rows;
        console.log(`[Queue Processor] Found ${duePosts.length} posts ready to publish`);

        if (duePosts.length === 0) {
            return res.json({
                success: true,
                message: 'No posts ready to publish',
                processed: 0
            });
        }

        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        for (const post of duePosts) {
            try {
                // Get user's Facebook connection and settings
                const userResult = await pool.query(
                    `SELECT fc.*, us.settings
                     FROM facebook_connections fc
                     LEFT JOIN user_settings us ON fc.user_id = us.user_id
                     WHERE fc.user_id = $1 AND fc.is_active = true`,
                    [post.user_id]
                );

                if (userResult.rows.length === 0) {
                    console.log(`[Queue Processor] No active Facebook connection for user ${post.user_id}`);
                    await markPostFailed(post.id, 'No active Facebook connection');
                    failedCount++;
                    continue;
                }

                const userConnection = userResult.rows[0];
                const settings = userConnection.settings || {};
                const scheduleSettings = settings.facebookSchedule || {};
                const maxPostsPerDay = scheduleSettings.maxPostsPerDay || '1';

                // Check if user has hit daily post limit
                const canPost = await canPostToday(post.user_id, maxPostsPerDay);
                if (!canPost) {
                    console.log(`[Queue Processor] User ${post.user_id} has reached daily post limit`);
                    // Reschedule for tomorrow
                    await rescheduleForTomorrow(post.id);
                    skippedCount++;
                    continue;
                }

                // Parse building data
                const building = JSON.parse(post.building_data);

                // Get available templates (array or single template)
                let availableTemplates = [];
                if (settings.facebookTemplates && Array.isArray(settings.facebookTemplates)) {
                    // Multiple templates selected
                    availableTemplates = settings.facebookTemplates;
                } else if (settings.facebookTemplate) {
                    // Single template (legacy)
                    availableTemplates = [settings.facebookTemplate];
                } else {
                    // Default template
                    availableTemplates = [
                        `🏠 New ${building.category} Available!\n\n` +
                        `Serial: ${building.serialNumber}\n` +
                        `Size: ${building.size}\n` +
                        `Price: ${building.price}\n\n` +
                        `Contact us for more details!`
                    ];
                }

                // Use smart template selection (avoids 10-day repetition, checks weekend templates)
                const scheduledDate = new Date(post.scheduled_time);
                const templateResult = await selectBestTemplate(
                    post.user_id,
                    availableTemplates,
                    scheduledDate,
                    false // isManual = false for automated posts
                );

                if (!templateResult.template) {
                    console.log(`[Queue Processor] No suitable template found: ${templateResult.reason}`);
                    // Reschedule for tomorrow to try again
                    await rescheduleForTomorrow(post.id);
                    skippedCount++;
                    continue;
                }

                console.log(`[Queue Processor] Selected template: ${templateResult.reason}`);
                const template = templateResult.template;

                // Replace template variables
                const message = replaceBuildingVariables(template, building);

                // Post to Facebook
                const postResult = await postToFacebook(
                    userConnection.page_id,
                    userConnection.page_access_token,
                    message,
                    building.imageUrl || building.images?.[0]
                );

                if (postResult.success) {
                    // Record template usage for smart rotation
                    await recordTemplateUsage(
                        post.user_id,
                        template,
                        false, // isManual = false
                        building.serialNumber
                    );

                    // Mark as posted
                    await pool.query(
                        `UPDATE facebook_post_queue
                         SET status = 'posted',
                             posted_at = NOW(),
                             last_error = NULL
                         WHERE id = $1`,
                        [post.id]
                    );
                    console.log(`[Queue Processor] Successfully posted ${building.serialNumber}`);
                    successCount++;
                } else {
                    await markPostFailed(post.id, postResult.error);
                    failedCount++;
                }

            } catch (error) {
                console.error(`[Queue Processor] Error processing post ${post.id}:`, error);
                await markPostFailed(post.id, error.message);
                failedCount++;
            }
        }

        return res.json({
            success: true,
            message: 'Queue processing complete',
            processed: duePosts.length,
            posted: successCount,
            failed: failedCount,
            skipped: skippedCount
        });

    } catch (error) {
        console.error('[Queue Processor] Fatal error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Post content to Facebook Page
 */
async function postToFacebook(pageId, pageAccessToken, message, imageUrl) {
    try {
        let url = `https://graph.facebook.com/v18.0/${pageId}/`;
        let body;

        if (imageUrl) {
            // Post with photo
            url += 'photos';
            body = {
                url: imageUrl,
                caption: message,
                access_token: pageAccessToken
            };
        } else {
            // Text-only post
            url += 'feed';
            body = {
                message: message,
                access_token: pageAccessToken
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.error) {
            console.error('[Facebook API] Error:', data.error);
            return { success: false, error: data.error.message };
        }

        return { success: true, postId: data.id || data.post_id };

    } catch (error) {
        console.error('[Facebook API] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Replace template variables with building data
 */
function replaceBuildingVariables(template, building) {
    let result = template;

    // Replace common variables
    result = result.replace(/\{serialNumber\}/g, building.serialNumber || 'N/A');
    result = result.replace(/\{category\}/g, building.category || 'Building');
    result = result.replace(/\{size\}/g, building.size || 'N/A');
    result = result.replace(/\{price\}/g, building.price || 'Call for pricing');
    result = result.replace(/\{description\}/g, building.description || '');
    result = result.replace(/\{location\}/g, building.location || '');
    result = result.replace(/\{lotName\}/g, building.lotName || '');

    return result;
}

/**
 * Mark a post as failed
 */
async function markPostFailed(postId, errorMessage) {
    await pool.query(
        `UPDATE facebook_post_queue
         SET attempts = attempts + 1,
             last_error = $1,
             status = CASE
                 WHEN attempts + 1 >= 3 THEN 'failed'
                 ELSE 'pending'
             END
         WHERE id = $2`,
        [errorMessage, postId]
    );
}

/**
 * Reschedule a post for tomorrow (when daily limit is reached)
 */
async function rescheduleForTomorrow(postId) {
    await pool.query(
        `UPDATE facebook_post_queue
         SET scheduled_time = scheduled_time + INTERVAL '1 day'
         WHERE id = $1`,
        [postId]
    );
}
