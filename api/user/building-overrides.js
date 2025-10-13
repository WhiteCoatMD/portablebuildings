/**
 * Building Overrides API
 * Get and update building status, visibility, and lot location
 */

const { Pool } = require('pg');
const { requireAuth } = require('../../lib/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function handler(req, res) {
    if (req.method === 'GET') {
        return await getOverrides(req, res);
    } else if (req.method === 'POST' || req.method === 'PUT') {
        return await saveOverrides(req, res);
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}

async function getOverrides(req, res) {
    try {
        const userId = req.user.id;

        // Get all overrides for this user
        const result = await pool.query(
            `SELECT serial_number, status, hidden, lot_location
             FROM building_overrides
             WHERE user_id = $1`,
            [userId]
        );

        // Convert to object keyed by serial number (matches localStorage format)
        const overrides = {};
        result.rows.forEach(row => {
            overrides[row.serial_number] = {
                status: row.status,
                hidden: row.hidden,
                lotLocation: row.lot_location
            };
        });

        return res.status(200).json({
            success: true,
            overrides
        });
    } catch (error) {
        console.error('Get overrides error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get building overrides'
        });
    }
}

async function saveOverrides(req, res) {
    try {
        const userId = req.user.id;
        const { overrides } = req.body;

        if (!overrides || typeof overrides !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Overrides object required'
            });
        }

        // Save each override
        for (const [serialNumber, override] of Object.entries(overrides)) {
            await pool.query(
                `INSERT INTO building_overrides (user_id, serial_number, status, hidden, lot_location, updated_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, serial_number)
                 DO UPDATE SET
                    status = $3,
                    hidden = $4,
                    lot_location = $5,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    userId,
                    serialNumber,
                    override.status || null,
                    override.hidden || false,
                    override.lotLocation || null
                ]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Building overrides saved successfully'
        });
    } catch (error) {
        console.error('Save overrides error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save building overrides'
        });
    }
}

module.exports = requireAuth(handler);
