/**
 * API endpoint to save lot configuration
 * Allows admin panel to update lots-config.json for automated sync
 */

const { put } = require('@vercel/blob');
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { lots } = req.body;

        if (!Array.isArray(lots)) {
            return res.status(400).json({ error: 'Lots must be an array' });
        }

        // Validate lot structure
        for (const lot of lots) {
            if (!lot.name || !lot.username || !lot.password) {
                return res.status(400).json({
                    error: 'Each lot must have name, username, and password'
                });
            }
        }

        const configContent = JSON.stringify(lots, null, 2);

        // Save to Vercel Blob storage so sync.js can fetch it
        const blob = await put('lots-config.json', configContent, {
            access: 'public',
            addRandomSuffix: false
        });

        return res.status(200).json({
            success: true,
            message: 'Lot configuration saved. Will sync automatically during next scheduled sync.',
            url: blob.url
        });

    } catch (error) {
        console.error('Error saving lot config:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
