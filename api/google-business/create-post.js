/**
 * Create a Google Business Profile post (local post)
 */

const { getValidAccessToken, getLocationId } = require('../../lib/google-business');

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
        const { userId, message, imageUrl, actionType, actionUrl } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'message is required'
            });
        }

        console.log(`[GBP] Creating post for user ${userId}...`);

        // Get valid access token (refreshes if needed)
        const accessToken = await getValidAccessToken(userId);

        // Get location ID
        const locationId = await getLocationId(userId);

        // Build post data
        const postData = {
            languageCode: 'en-US',
            summary: message.substring(0, 1500), // GBP has a 1500 char limit
            callToAction: actionType && actionUrl ? {
                actionType: actionType, // CALL, ORDER, LEARN_MORE, SIGN_UP, etc.
                url: actionUrl
            } : undefined,
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

        console.log('[GBP] Post data:', JSON.stringify(postData, null, 2));

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
            console.error('[GBP] Failed to create post:', errorText);

            // Try to parse error details
            try {
                const errorData = JSON.parse(errorText);
                return res.status(response.status).json({
                    success: false,
                    error: errorData.error?.message || 'Failed to create post',
                    details: errorData
                });
            } catch (e) {
                return res.status(response.status).json({
                    success: false,
                    error: 'Failed to create post',
                    details: errorText
                });
            }
        }

        const result = await response.json();
        console.log('[GBP] Post created successfully:', result);

        return res.status(200).json({
            success: true,
            message: 'Post created successfully',
            postData: result
        });

    } catch (error) {
        console.error('[GBP] Error creating post:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create post',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
