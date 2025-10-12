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
        // Get the sync server URL from environment
        const syncServerUrl = process.env.SYNC_SERVER_URL;

        if (!syncServerUrl) {
            return res.status(200).json({
                success: false,
                message: 'Manual sync not configured. Set SYNC_SERVER_URL environment variable in Vercel.',
                help: 'The sync still runs automatically at 2 AM daily.'
            });
        }

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
            help: 'Make sure the sync API server is running on your DigitalOcean droplet'
        });
    }
};
