/**
 * Send a test post to Google Business Profile
 * Uses a sample building from the user's inventory
 */

const { getPool } = require('../../lib/db');
const { getValidAccessToken, getLocationId } = require('../../lib/google-business');

const pool = getPool();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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
                error: 'userId is required'
            });
        }

        console.log(`[GBP Test Post] Creating test post for user ${userId}...`);

        // Get user's settings
        const settingsResult = await pool.query(
            `SELECT setting_key, setting_value FROM user_settings WHERE user_id = $1`,
            [userId]
        );

        const settings = {};
        settingsResult.rows.forEach(row => {
            try {
                settings[row.setting_key] = JSON.parse(row.setting_value);
            } catch (e) {
                settings[row.setting_key] = row.setting_value;
            }
        });

        // Get template
        const template = settings.autoPostTemplateGBP || `🏠 New Arrival! {{name}}

📐 Size: {{size}}
💰 Cash Price: {{price}}
📍 Location: {{location}}

Call {{phone}} or visit our website to learn more!

#PortableBuildings #{{type}} #ForSale`;

        // Get a sample building from user's inventory
        const buildingsResult = await pool.query(
            `SELECT * FROM buildings
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (buildingsResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No buildings found in inventory to test with'
            });
        }

        const building = buildingsResult.rows[0];

        // Get building images
        const imagesResult = await pool.query(
            `SELECT image_url FROM building_images
             WHERE building_id = $1
             ORDER BY display_order ASC
             LIMIT 1`,
            [building.id]
        );

        const imageUrl = imagesResult.rows.length > 0 ? imagesResult.rows[0].image_url : null;

        // Format template
        const businessName = settings.cpb_business_name || 'Your Business';
        const phone = settings.cpb_phone || '';
        const location = settings.cpb_address || '';

        let message = template
            .replace(/{{name}}/g, building.name || 'Portable Building')
            .replace(/{{size}}/g, building.size || '')
            .replace(/{{price}}/g, building.cash_price ? `$${building.cash_price}` : 'Contact for pricing')
            .replace(/{{type}}/g, building.type || 'Building')
            .replace(/{{location}}/g, location)
            .replace(/{{phone}}/g, phone)
            .replace(/{{rto36}}/g, building.rto_36 ? `$${building.rto_36}` : '')
            .replace(/{{rto48}}/g, building.rto_48 ? `$${building.rto_48}` : '')
            .replace(/{{rto60}}/g, building.rto_60 ? `$${building.rto_60}` : '')
            .replace(/{{rto72}}/g, building.rto_72 ? `$${building.rto_72}` : '')
            .replace(/{{rtoAll}}/g, [
                building.rto_36 ? `36mo: $${building.rto_36}` : '',
                building.rto_48 ? `48mo: $${building.rto_48}` : '',
                building.rto_60 ? `60mo: $${building.rto_60}` : '',
                building.rto_72 ? `72mo: $${building.rto_72}` : ''
            ].filter(Boolean).join(' | '));

        // Add test prefix
        message = `🧪 TEST POST 🧪\n\n${message}`;

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

        console.log('[GBP Test Post] Post data:', JSON.stringify(postData, null, 2));

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
            console.error('[GBP Test Post] Failed to create post:', errorText);

            // Try to parse error details
            try {
                const errorData = JSON.parse(errorText);
                return res.status(response.status).json({
                    success: false,
                    error: errorData.error?.message || 'Failed to create test post',
                    details: errorData
                });
            } catch (e) {
                return res.status(response.status).json({
                    success: false,
                    error: 'Failed to create test post',
                    details: errorText
                });
            }
        }

        const result = await response.json();
        console.log('[GBP Test Post] Post created successfully:', result);

        // Update last_post_at
        await pool.query(
            `UPDATE google_business_connections
             SET last_post_at = NOW()
             WHERE user_id = $1`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Test post created successfully! Check your Google Business Profile.',
            postData: result
        });

    } catch (error) {
        console.error('[GBP Test Post] Error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create test post',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
