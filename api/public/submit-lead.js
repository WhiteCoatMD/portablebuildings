/**
 * Public endpoint for customers to submit inquiries (no auth required)
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
            customerName,
            customerEmail,
            customerPhone,
            buildingSerial,
            notes,
            subdomain
        } = req.body;

        // Validation
        if (!customerName || !customerName.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }

        if (!customerEmail && !customerPhone) {
            return res.status(400).json({
                success: false,
                error: 'Either email or phone is required'
            });
        }

        if (!subdomain) {
            return res.status(400).json({
                success: false,
                error: 'Subdomain is required'
            });
        }

        // Find user by subdomain
        const userResult = await pool.query(
            'SELECT id FROM users WHERE subdomain = $1',
            [subdomain.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userId = userResult.rows[0].id;

        // Insert lead
        const result = await pool.query(
            `INSERT INTO leads (
                user_id,
                customer_name,
                customer_email,
                customer_phone,
                building_serial,
                notes,
                source,
                priority,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'website', 'medium', 'new')
            RETURNING *`,
            [
                userId,
                customerName.trim(),
                customerEmail ? customerEmail.trim() : null,
                customerPhone ? customerPhone.trim() : null,
                buildingSerial ? buildingSerial.trim() : null,
                notes ? notes.trim() : null
            ]
        );

        const lead = result.rows[0];

        console.log('[Public Lead] New inquiry submitted:', {
            leadId: lead.id,
            userId: userId,
            customerName: lead.customer_name,
            buildingSerial: lead.building_serial
        });

        return res.json({
            success: true,
            message: 'Thank you! We\'ll be in touch soon.',
            leadId: lead.id
        });

    } catch (error) {
        console.error('[Public Lead] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to submit inquiry. Please try again.'
        });
    }
};
