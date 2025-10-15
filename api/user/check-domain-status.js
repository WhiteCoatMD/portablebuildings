/**
 * Check Domain Verification Status
 * Returns the current status of the user's custom domain
 */
const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');
const dns = require('dns').promises;

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req, res) {
    if (req.method !== 'GET') {
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

        // Get user's domain info
        const result = await pool.query(
            'SELECT custom_domain, domain_verified FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = result.rows[0];

        if (!user.custom_domain) {
            return res.status(200).json({
                success: true,
                hasDomain: false,
                message: 'No custom domain configured'
            });
        }

        // If already verified, just return status
        if (user.domain_verified) {
            return res.status(200).json({
                success: true,
                hasDomain: true,
                domain: user.custom_domain,
                verified: true,
                message: 'Domain is verified and active'
            });
        }

        // Check DNS records to see if domain is ready for verification
        let dnsConfigured = false;
        let dnsDetails = {
            aRecord: false,
            cnameRecord: false
        };

        try {
            // Check A record for root domain
            const aRecords = await dns.resolve4(user.custom_domain);
            if (aRecords && aRecords.includes('76.76.21.93')) {
                dnsDetails.aRecord = true;
            }
        } catch (e) {
            // A record not found
        }

        try {
            // Check CNAME record for www subdomain
            const cnameRecords = await dns.resolveCname(`www.${user.custom_domain}`);
            if (cnameRecords && cnameRecords.includes('cname.vercel-dns.com')) {
                dnsDetails.cnameRecord = true;
            }
        } catch (e) {
            // CNAME record not found
        }

        dnsConfigured = dnsDetails.aRecord || dnsDetails.cnameRecord;

        // If DNS is configured correctly, auto-verify the domain
        if (dnsConfigured) {
            await pool.query(
                'UPDATE users SET domain_verified = true, updated_at = NOW() WHERE id = $1',
                [userId]
            );

            return res.status(200).json({
                success: true,
                hasDomain: true,
                domain: user.custom_domain,
                verified: true,
                autoVerified: true,
                message: 'Domain verified successfully!',
                dnsDetails
            });
        }

        // DNS not configured yet
        return res.status(200).json({
            success: true,
            hasDomain: true,
            domain: user.custom_domain,
            verified: false,
            message: 'Waiting for DNS configuration',
            dnsDetails,
            helpText: dnsDetails.aRecord ?
                'A record found, but CNAME record is missing. Add www CNAME record.' :
                dnsDetails.cnameRecord ?
                'CNAME record found, but A record is missing. Add A record for root domain.' :
                'DNS records not found yet. Please configure both A and CNAME records.'
        });

    } catch (error) {
        console.error('[Check Domain Status] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to check domain status',
            details: error.message
        });
    }
}

module.exports = handler;
