/**
 * Update User Profile API
 * Updates business information in the users table
 */
const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No authorization token provided'
        });
    }

    const token = authHeader.substring(7);

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const { businessName, phone, email, address } = req.body;

        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (businessName !== undefined) {
            updates.push(`business_name = $${paramCount}`);
            values.push(businessName.trim() || null);
            paramCount++;
        }

        if (phone !== undefined) {
            updates.push(`phone = $${paramCount}`);
            values.push(phone.trim() || null);
            paramCount++;
        }

        if (email !== undefined) {
            updates.push(`best_contact_email = $${paramCount}`);
            values.push(email.trim() || null);
            paramCount++;
        }

        if (address !== undefined) {
            updates.push(`address = $${paramCount}`);
            values.push(address.trim() || null);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        // Add updated_at timestamp
        updates.push(`updated_at = NOW()`);

        // Add user ID as last parameter
        values.push(userId);

        // Execute update
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
        );

        // Get updated user data
        const result = await pool.query(
            'SELECT business_name, phone, best_contact_email, address FROM users WHERE id = $1',
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                businessName: result.rows[0].business_name,
                phone: result.rows[0].phone,
                email: result.rows[0].best_contact_email,
                address: result.rows[0].address
            }
        });

    } catch (error) {
        console.error('[Update Profile] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to update profile',
            details: error.message
        });
    }
}

module.exports = handler;
