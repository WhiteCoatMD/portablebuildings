/**
 * User Settings API
 * Get and update user-specific settings
 */

const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

const pool = getPool();

async function handler(req, res) {
    if (req.method === 'GET') {
        return await getSettings(req, res);
    } else if (req.method === 'POST' || req.method === 'PUT') {
        return await saveSettings(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}

async function getSettings(req, res) {
    try {
        const userId = req.user.id;

        // Get all settings for this user
        const result = await pool.query(
            'SELECT setting_key, setting_value FROM user_settings WHERE user_id = $1',
            [userId]
        );

        // Convert to key-value object
        const settings = {};
        result.rows.forEach(row => {
            try {
                // Try to parse JSON values
                settings[row.setting_key] = JSON.parse(row.setting_value);
            } catch (e) {
                // If not JSON, store as string
                settings[row.setting_key] = row.setting_value;
            }
        });

        return res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get settings'
        });
    }
}

async function saveSettings(req, res) {
    try {
        const userId = req.user.id;
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Settings object required'
            });
        }

        // Save each setting
        for (const [key, value] of Object.entries(settings)) {
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

            await pool.query(
                `INSERT INTO user_settings (user_id, setting_key, setting_value, updated_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, setting_key)
                 DO UPDATE SET setting_value = $3, updated_at = CURRENT_TIMESTAMP`,
                [userId, key, valueStr]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Settings saved successfully'
        });
    } catch (error) {
        console.error('Save settings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save settings'
        });
    }
}

module.exports = requireAuth(handler);
