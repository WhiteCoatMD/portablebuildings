/**
 * Public endpoint for ShedSync demo requests (no auth required)
 */
const { getPool } = require('../../lib/db');

const pool = getPool();

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const {
            name,
            city,
            state,
            phone,
            email
        } = req.body;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }

        if (!city || !city.trim()) {
            return res.status(400).json({
                success: false,
                error: 'City is required'
            });
        }

        if (!state || !state.trim()) {
            return res.status(400).json({
                success: false,
                error: 'State is required'
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Phone is required'
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Insert demo lead
        const result = await pool.query(
            `INSERT INTO demo_leads (
                name,
                city,
                state,
                phone,
                email,
                status
            ) VALUES ($1, $2, $3, $4, $5, 'new')
            RETURNING *`,
            [
                name.trim(),
                city.trim(),
                state.trim(),
                phone.trim(),
                email.trim()
            ]
        );

        const demoLead = result.rows[0];

        console.log('[Demo Lead] New demo request submitted:', {
            id: demoLead.id,
            name: demoLead.name,
            city: demoLead.city,
            state: demoLead.state
        });

        return res.json({
            success: true,
            message: 'Thank you for your interest! We\'ll be in touch soon to schedule your demo.',
            leadId: demoLead.id
        });

    } catch (error) {
        console.error('[Demo Lead] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to submit demo request. Please try again.'
        });
    }
};
