/**
 * Save Facebook schedule settings to database
 * POST /api/user/save-schedule-settings
 */

const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get user ID from auth token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { scheduleSettings } = req.body;

        if (!scheduleSettings) {
            return res.status(400).json({ error: 'Schedule settings are required' });
        }

        // Update user_settings table
        await pool.query(
            `INSERT INTO user_settings (user_id, settings)
             VALUES ($1, jsonb_build_object('facebookSchedule', $2))
             ON CONFLICT (user_id)
             DO UPDATE SET
                settings = COALESCE(user_settings.settings, '{}'::jsonb) || jsonb_build_object('facebookSchedule', $2),
                updated_at = NOW()`,
            [userId, JSON.stringify(scheduleSettings)]
        );

        return res.json({
            success: true,
            message: 'Schedule settings saved successfully'
        });

    } catch (error) {
        console.error('[Save Schedule Settings] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
