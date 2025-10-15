/**
 * Facebook Auto-Post API
 * Posts building listings to Facebook Business Page
 */

const { getPool } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

const pool = getPool();

module.exports = async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Check if user is on trial - Facebook posting not allowed
        const userResult = await pool.query(
            'SELECT subscription_status FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (userResult.rows[0].subscription_status === 'trial') {
            return res.status(403).json({
                success: false,
                error: 'Facebook posting not available on trial plan',
                message: 'Upgrade to premium to unlock Facebook auto-posting',
                requiresUpgrade: true
            });
        }

        const { building, config, businessPhone } = req.body;

        // Validate required fields
        if (!building || !config) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: building and config'
            });
        }

        if (!config.pageId || !config.accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Facebook Page ID and Access Token are required'
            });
        }

        // Build the post message from template
        let message = config.template || `🏠 New Arrival! {{name}}

📐 Size: {{size}}
💰 Cash Price: {{price}}
📍 Location: {{location}}

Call us at {{phone}} or visit our website to learn more!

#PortableBuildings #{{type}} #ForSale`;

        // Format RTO options (matching tooltip format for each term)
        // Safely convert to number and format
        const safeRto36 = building.rto36 ? parseFloat(building.rto36) : null;
        const safeRto48 = building.rto48 ? parseFloat(building.rto48) : null;
        const safeRto60 = building.rto60 ? parseFloat(building.rto60) : null;
        const safeRto72 = building.rto72 ? parseFloat(building.rto72) : null;

        const rto36 = safeRto36 ? `36 months: $${safeRto36.toFixed(2)}/mo` : 'N/A';
        const rto48 = safeRto48 ? `48 months: $${safeRto48.toFixed(2)}/mo` : 'N/A';
        const rto60 = safeRto60 ? `60 months: $${safeRto60.toFixed(2)}/mo` : 'N/A';
        const rto72 = safeRto72 ? `72 months: $${safeRto72.toFixed(2)}/mo` : 'N/A';

        // Format all RTO options together (matching the tooltip format)
        let rtoAll = '';
        if (safeRto36) {
            rtoAll = `Rent-to-Own Options:
• 36 months: $${safeRto36.toFixed(2)}/mo
• 48 months: $${safeRto48.toFixed(2)}/mo
• 60 months: $${safeRto60.toFixed(2)}/mo
• 72 months: $${safeRto72.toFixed(2)}/mo
*Plus your local sales tax`;
        }

        // Replace placeholders
        message = message
            .replace(/\{\{name\}\}/g, building.title || building.typeName)
            .replace(/\{\{size\}\}/g, building.sizeDisplay || '')
            .replace(/\{\{price\}\}/g, building.price ? `$${building.price.toLocaleString()}` : 'Call for price')
            .replace(/\{\{type\}\}/g, building.typeName || '')
            .replace(/\{\{location\}\}/g, building.location || 'GPB Sales')
            .replace(/\{\{phone\}\}/g, businessPhone || '318-594-5909')
            .replace(/\{\{rto36\}\}/g, rto36)
            .replace(/\{\{rto48\}\}/g, rto48)
            .replace(/\{\{rto60\}\}/g, rto60)
            .replace(/\{\{rto72\}\}/g, rto72)
            .replace(/\{\{rtoAll\}\}/g, rtoAll);

        // Prepare Facebook API request
        const fbApiUrl = `https://graph.facebook.com/v18.0/${config.pageId}/photos`;

        let postData;

        // If building has images, post with photo
        if (building.images && building.images.length > 0) {
            postData = {
                url: building.images[0], // Use first image
                caption: message,
                access_token: config.accessToken
            };
        } else {
            // Post text-only to feed
            const feedUrl = `https://graph.facebook.com/v18.0/${config.pageId}/feed`;
            postData = {
                message: message,
                access_token: config.accessToken
            };

            // Post to feed instead of photos
            const response = await fetch(feedUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });

            const result = await response.json();

            if (result.error) {
                console.error('Facebook API Error:', result.error);
                return res.status(400).json({
                    success: false,
                    error: result.error.message || 'Failed to post to Facebook',
                    fbError: result.error
                });
            }

            return res.status(200).json({
                success: true,
                postId: result.id,
                message: 'Successfully posted to Facebook (text only)'
            });
        }

        // Post with image
        const response = await fetch(fbApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });

        const result = await response.json();

        if (result.error) {
            console.error('Facebook API Error:', result.error);
            return res.status(400).json({
                success: false,
                error: result.error.message || 'Failed to post to Facebook',
                fbError: result.error
            });
        }

        return res.status(200).json({
            success: true,
            postId: result.id,
            postUrl: result.post_id ? `https://facebook.com/${result.post_id}` : null,
            message: 'Successfully posted to Facebook with image'
        });

    } catch (error) {
        console.error('Post to Facebook error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
