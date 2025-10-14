/**
 * Super Admin - Get User Inventory Count
 * Returns the count of buildings in the main inventory
 * Since inventory is currently shared, this returns the same count for all users
 */

const { requireAuth } = require('../../lib/auth');
const fs = require('fs');
const path = require('path');

async function handler(req, res) {
    // Check if user is admin
    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Read the inventory.js file
        const inventoryPath = path.join(process.cwd(), 'inventory.js');

        if (!fs.existsSync(inventoryPath)) {
            return res.status(200).json({
                success: true,
                count: 0
            });
        }

        const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');

        // Extract the INVENTORY array (not PROCESSED_INVENTORY which is a function call)
        const match = inventoryContent.match(/const\s+INVENTORY\s*=\s*(\[[\s\S]*?\]);/);

        if (!match) {
            console.error('Could not find INVENTORY array in inventory.js');
            return res.status(200).json({
                success: true,
                count: 0
            });
        }

        // Parse the inventory array
        const inventory = JSON.parse(match[1]);

        return res.status(200).json({
            success: true,
            count: Array.isArray(inventory) ? inventory.length : 0
        });

    } catch (error) {
        console.error('Get inventory count error:', error);
        return res.status(200).json({
            success: true,
            count: 0 // Return 0 on error rather than failing
        });
    }
}

module.exports = requireAuth(handler);
