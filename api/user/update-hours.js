/**
 * Update User Location Hours
 * Updates the user's business hours in the database
 */

const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { location_hours } = req.body;

        // Update user's location hours
        await pool.query(
            'UPDATE users SET location_hours = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(location_hours), req.user.id]
        );

        return res.status(200).json({
            success: true,
            message: 'Location hours updated successfully'
        });

    } catch (error) {
        console.error('Update hours error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update location hours'
        });
    }
}

module.exports = requireAuth(handler);
