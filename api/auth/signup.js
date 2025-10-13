/**
 * User Registration API
 * Creates a new user account
 */

const { createUser } = require('../../lib/auth');

module.exports = async function handler(req, res) {
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
        const { email, password, businessName, fullName, phone, address, bestContactEmail } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        if (!businessName || !fullName || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'Business name, full name, phone, and address are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Validate best contact email if provided
        if (bestContactEmail && !emailRegex.test(bestContactEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contact email format'
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters'
            });
        }

        // Create user with all fields
        const user = await createUser(email, password, businessName, fullName, phone, address, bestContactEmail);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user.id,
                email: user.email,
                businessName: user.business_name,
                fullName: user.full_name
            }
        });

    } catch (error) {
        console.error('Signup error:', error);

        if (error.message === 'User already exists') {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to create account'
        });
    }
};
