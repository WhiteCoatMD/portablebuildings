/**
 * Authentication Utilities
 * Handles password hashing, JWT tokens, and user verification
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('./db');

// CRITICAL: JWT_SECRET must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set. Application cannot start without it.');
}
const TOKEN_EXPIRY = '7d'; // 7 days

// Use shared database pool
const pool = getPool();

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for user
 */
function generateToken(userId, email) {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Create a new user account
 */
async function createUser(email, password, businessName = null, fullName = null, phone = null, address = null, bestContactEmail = null) {
    try {
        // Check if user already exists
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            throw new Error('User already exists');
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user with all fields and set 72-hour trial
        const trialEndsAt = new Date();
        trialEndsAt.setHours(trialEndsAt.getHours() + 72); // 72 hours from now

        const result = await pool.query(
            `INSERT INTO users (
                email, password_hash, business_name, full_name, phone, address, best_contact_email,
                subscription_status, trial_ends_at
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'trial', $8)
             RETURNING id, email, business_name, full_name, phone, address, best_contact_email, created_at, subscription_status, trial_ends_at`,
            [email, passwordHash, businessName, fullName, phone, address, bestContactEmail, trialEndsAt]
        );

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

/**
 * Authenticate user with email and password
 */
async function authenticateUser(email, password) {
    try {
        // Get user
        const result = await pool.query(
            `SELECT id, email, password_hash, business_name, is_admin
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid email or password');
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await comparePassword(password, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        // Create session in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await pool.query(
            `INSERT INTO sessions (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, token, expiresAt]
        );

        // Update last login
        await pool.query(
            `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
        );

        return {
            user: {
                id: user.id,
                email: user.email,
                businessName: user.business_name,
                isAdmin: user.is_admin
            },
            token
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Get user from token
 */
async function getUserFromToken(token) {
    try {
        // Verify JWT
        const decoded = verifyToken(token);
        if (!decoded) {
            return null;
        }

        // Check session in database
        // Try with new fields first, fall back to old fields if they don't exist
        let result;
        try {
            result = await pool.query(
                `SELECT s.user_id, s.expires_at, u.email, u.business_name, u.is_admin,
                        u.full_name, u.phone, u.address, u.best_contact_email, u.location_hours,
                        u.subdomain, u.custom_domain, u.domain_verified
                 FROM sessions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.token = $1
                 AND s.expires_at > NOW()`,
                [token]
            );
        } catch (error) {
            // If new fields don't exist, fall back to old query
            console.log('Falling back to basic user fields');
            result = await pool.query(
                `SELECT s.user_id, s.expires_at, u.email, u.business_name, u.is_admin
                 FROM sessions s
                 JOIN users u ON s.user_id = u.id
                 WHERE s.token = $1
                 AND s.expires_at > NOW()`,
                [token]
            );
        }

        if (result.rows.length === 0) {
            return null;
        }

        const session = result.rows[0];
        return {
            id: session.user_id,
            email: session.email,
            businessName: session.business_name,
            is_admin: session.is_admin,
            full_name: session.full_name || null,
            phone: session.phone || null,
            address: session.address || null,
            best_contact_email: session.best_contact_email || null,
            location_hours: session.location_hours || null,
            subdomain: session.subdomain || null,
            custom_domain: session.custom_domain || null,
            domain_verified: session.domain_verified || false
        };
    } catch (error) {
        return null;
    }
}

/**
 * Logout user (invalidate session)
 */
async function logoutUser(token) {
    try {
        await pool.query(
            'DELETE FROM sessions WHERE token = $1',
            [token]
        );
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Clean up expired sessions (can be run periodically)
 */
async function cleanExpiredSessions() {
    try {
        await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    } catch (error) {
        console.error('Failed to clean expired sessions:', error);
    }
}

/**
 * Middleware to verify authentication
 */
function requireAuth(handler) {
    return async (req, res) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer '
            const user = await getUserFromToken(token);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }

            // Attach user to request
            req.user = user;

            // Call the actual handler
            return handler(req, res);
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Authentication error'
            });
        }
    };
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    createUser,
    authenticateUser,
    getUserFromToken,
    logoutUser,
    cleanExpiredSessions,
    requireAuth
};
