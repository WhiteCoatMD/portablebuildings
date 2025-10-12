/**
 * API endpoint to trigger manual sync
 * Sends a request to the DigitalOcean server to run sync immediately
 */

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
        // Get the sync server URL from environment or default
        const syncServerUrl = process.env.SYNC_SERVER_URL || 'http://YOUR_DIGITALOCEAN_IP:3002';

        // Try to trigger the sync on the DigitalOcean server
        const response = await fetch(`${syncServerUrl}/trigger-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error('Sync server did not respond');
        }

        const result = await response.json();

        return res.status(200).json({
            success: true,
            message: 'Manual sync triggered successfully',
            result
        });

    } catch (error) {
        console.error('Error triggering sync:', error);

        // Return a helpful message
        return res.status(200).json({
            success: false,
            message: 'Could not connect to sync server. The sync will run automatically at 2 AM.',
            error: error.message,
            help: 'To enable manual sync, make sure the sync server is running on your DigitalOcean droplet with: pm2 start sync-api-server.js'
        });
    }
};
