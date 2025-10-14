/**
 * Get Site Configuration by Domain
 * Detects the current domain and returns the appropriate user's site configuration
 */
const { getPool } = require('../../lib/db');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Get the domain from query parameter or Host header
        let domain = req.query.domain || req.headers.host || '';

        // Remove port if present
        domain = domain.split(':')[0].toLowerCase();

        console.log(`[Site] Looking up domain: ${domain}`);

        let user = null;

        // Check if it's a subdomain of shed-sync.com
        if (domain.endsWith('.shed-sync.com')) {
            const subdomain = domain.replace('.shed-sync.com', '');

            // Don't treat www as a subdomain
            if (subdomain === 'www' || subdomain === '') {
                return res.status(200).json({
                    success: false,
                    error: 'Main site - not a dealer site',
                    isMainSite: true
                });
            }

            console.log(`[Site] Looking up subdomain: ${subdomain}`);

            const result = await pool.query(
                'SELECT * FROM users WHERE subdomain = $1',
                [subdomain]
            );

            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        }
        // Check if it's a custom domain
        else if (domain !== 'shed-sync.com' && domain !== 'localhost') {
            console.log(`[Site] Looking up custom domain: ${domain}`);

            const result = await pool.query(
                'SELECT * FROM users WHERE custom_domain = $1 AND domain_verified = true',
                [domain]
            );

            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Site not found',
                domain: domain
            });
        }

        // Load user's settings from database
        const settingsResult = await pool.query(
            'SELECT settings FROM user_settings WHERE user_id = $1',
            [user.id]
        );

        const settings = settingsResult.rows.length > 0
            ? settingsResult.rows[0].settings
            : {};

        // Load user's inventory
        const inventoryResult = await pool.query(
            `SELECT * FROM user_inventory
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [user.id]
        );

        // Return site configuration
        return res.status(200).json({
            success: true,
            site: {
                userId: user.id,
                businessName: user.business_name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                bestContactEmail: user.best_contact_email,
                subdomain: user.subdomain,
                customDomain: user.custom_domain,
                settings: settings,
                locationHours: user.location_hours || {},
                inventory: inventoryResult.rows.map(item => ({
                    serialNumber: item.serial_number,
                    typeCode: item.type_code,
                    typeName: item.type_name,
                    title: item.title,
                    sizeDisplay: item.size_display,
                    width: item.width,
                    length: item.length,
                    dateBuilt: item.date_built,
                    price: item.price,
                    cashPrice: item.price,
                    rto36: item.rto36,
                    rto48: item.rto48,
                    rto60: item.rto60,
                    rto72: item.rto72,
                    isRepo: item.is_repo,
                    location: item.location,
                    status: item.auto_status || 'available'
                }))
            }
        });

    } catch (error) {
        console.error('[Site] Error loading site:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to load site configuration',
            details: error.message
        });
    }
}

module.exports = handler;
