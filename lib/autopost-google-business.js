/**
 * Auto-post new buildings to Google Business Profile
 */

const { getPool } = require('./db');
const { getValidAccessToken, getLocationId } = require('./google-business');

const pool = getPool();

/**
 * Check if building should be auto-posted to GBP
 */
async function shouldAutoPost(userId, building, settings) {
    // Check if GBP auto-posting is enabled
    if (!settings.enableAutoPostGBP) {
        return { shouldPost: false, reason: 'Auto-posting disabled' };
    }

    // Check if user has GBP connected
    const connectionResult = await pool.query(
        `SELECT is_active FROM google_business_connections WHERE user_id = $1`,
        [userId]
    );

    if (connectionResult.rows.length === 0 || !connectionResult.rows[0].is_active) {
        return { shouldPost: false, reason: 'GBP not connected' };
    }

    // Check auto-post conditions
    if (settings.autoPostNewOnlyGBP && building.isRepo) {
        return { shouldPost: false, reason: 'Repo buildings excluded' };
    }

    if (settings.autoPostWithImagesGBP) {
        // Check if building has images
        const imagesResult = await pool.query(
            `SELECT COUNT(*) FROM building_images WHERE building_id = (
                SELECT id FROM user_inventory WHERE user_id = $1 AND serial_number = $2
            )`,
            [userId, building.serialNumber]
        );

        const imageCount = parseInt(imagesResult.rows[0].count);
        if (imageCount === 0) {
            return { shouldPost: false, reason: 'No images uploaded' };
        }
    }

    if (settings.autoPostAvailableOnlyGBP) {
        // Check if building is available (not sold/pending)
        const statusResult = await pool.query(
            `SELECT status FROM user_inventory WHERE user_id = $1 AND serial_number = $2`,
            [userId, building.serialNumber]
        );

        if (statusResult.rows.length > 0) {
            const status = statusResult.rows[0].status;
            if (status === 'sold' || status === 'pending') {
                return { shouldPost: false, reason: 'Building not available' };
            }
        }
    }

    return { shouldPost: true };
}

/**
 * Auto-post a new building to Google Business Profile
 */
async function autoPostToGBP(userId, building, settings) {
    try {
        console.log(`[GBP Autopost] Checking if should post building ${building.serialNumber}...`);

        // Check if should post
        const check = await shouldAutoPost(userId, building, settings);
        if (!check.shouldPost) {
            console.log(`[GBP Autopost] Skipping: ${check.reason}`);
            return { success: true, posted: false, reason: check.reason };
        }

        // Get template
        const template = settings.autoPostTemplateGBP || `🏠 New Arrival! {{name}}

📐 Size: {{size}}
💰 Cash Price: {{price}}
📍 Location: {{location}}

Call {{phone}} or visit our website to learn more!

#PortableBuildings #{{type}} #ForSale`;

        // Get building images
        const imagesResult = await pool.query(
            `SELECT image_url FROM building_images
             WHERE building_id = (
                 SELECT id FROM user_inventory WHERE user_id = $1 AND serial_number = $2
             )
             ORDER BY display_order ASC
             LIMIT 1`,
            [userId, building.serialNumber]
        );

        const imageUrl = imagesResult.rows.length > 0 ? imagesResult.rows[0].image_url : null;

        // Format template
        const businessName = settings.cpb_business_name || 'Your Business';
        const phone = settings.cpb_phone || '';
        const location = settings.cpb_address || building.location || '';

        let message = template
            .replace(/{{name}}/g, building.title || 'Portable Building')
            .replace(/{{size}}/g, building.sizeDisplay || '')
            .replace(/{{price}}/g, building.price ? `$${building.price}` : 'Contact for pricing')
            .replace(/{{type}}/g, building.typeName || 'Building')
            .replace(/{{location}}/g, location)
            .replace(/{{phone}}/g, phone)
            .replace(/{{rto36}}/g, building.rto36 ? `$${building.rto36}` : '')
            .replace(/{{rto48}}/g, building.rto48 ? `$${building.rto48}` : '')
            .replace(/{{rto60}}/g, building.rto60 ? `$${building.rto60}` : '')
            .replace(/{{rto72}}/g, building.rto72 ? `$${building.rto72}` : '')
            .replace(/{{rtoAll}}/g, [
                building.rto36 ? `36mo: $${building.rto36}` : '',
                building.rto48 ? `48mo: $${building.rto48}` : '',
                building.rto60 ? `60mo: $${building.rto60}` : '',
                building.rto72 ? `72mo: $${building.rto72}` : ''
            ].filter(Boolean).join(' | '));

        // Get valid access token (refreshes if needed)
        const accessToken = await getValidAccessToken(userId);

        // Get location ID
        const locationId = await getLocationId(userId);

        // Build post data
        const postData = {
            languageCode: 'en-US',
            summary: message.substring(0, 1500), // GBP has a 1500 char limit
            media: imageUrl ? [{
                mediaFormat: 'PHOTO',
                sourceUrl: imageUrl
            }] : undefined,
            topicType: 'STANDARD'
        };

        // Remove undefined fields
        Object.keys(postData).forEach(key => {
            if (postData[key] === undefined) {
                delete postData[key];
            }
        });

        console.log('[GBP Autopost] Creating post...');

        // Create the post
        const response = await fetch(
            `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GBP Autopost] Failed to create post:', errorText);
            return {
                success: false,
                posted: false,
                error: `Failed to create post: ${errorText}`
            };
        }

        const result = await response.json();
        console.log('[GBP Autopost] Post created successfully');

        // Update last_post_at
        await pool.query(
            `UPDATE google_business_connections
             SET last_post_at = NOW()
             WHERE user_id = $1`,
            [userId]
        );

        return {
            success: true,
            posted: true,
            postData: result
        };

    } catch (error) {
        console.error('[GBP Autopost] Error:', error);
        return {
            success: false,
            posted: false,
            error: error.message
        };
    }
}

module.exports = {
    shouldAutoPost,
    autoPostToGBP
};
