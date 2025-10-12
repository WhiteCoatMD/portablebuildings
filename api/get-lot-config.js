/**
 * API endpoint to get lot configuration
 * Returns the lots-config from Vercel Blob storage
 */

const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // List all blobs and find lots-config.json
        const { blobs } = await list();
        const configBlob = blobs.find(b => b.pathname === 'lots-config.json');

        if (!configBlob) {
            return res.status(200).json({
                success: true,
                lots: []
            });
        }

        // Fetch the blob content
        const response = await fetch(configBlob.url);
        const configContent = await response.text();
        const lots = JSON.parse(configContent);

        return res.status(200).json({
            success: true,
            lots
        });

    } catch (error) {
        console.error('Error fetching lot config:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            lots: []
        });
    }
};
