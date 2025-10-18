/**
 * Change the selected Google Business Profile location
 */

const { getPool } = require('../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
        const { userId, locationId, locationName, locationAddress } = req.body;

        if (!userId || !locationId) {
            return res.status(400).json({
                success: false,
                error: 'userId and locationId are required'
            });
        }

        // Update the selected location
        await pool.query(
            `UPDATE google_business_connections
             SET location_id = $1,
                 location_name = $2,
                 location_address = $3,
                 updated_at = NOW()
             WHERE user_id = $4`,
            [locationId, locationName, locationAddress, userId]
        );

        console.log(`[GBP Change Location] Updated to location: ${locationName}`);

        return res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            location: {
                id: locationId,
                name: locationName,
                address: locationAddress
            }
        });

    } catch (error) {
        console.error('[GBP Change Location] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to change location'
        });
    }
};
