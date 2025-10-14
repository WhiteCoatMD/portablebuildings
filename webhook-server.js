/**
 * Webhook Server for DigitalOcean
 * Listens for sync requests from Vercel and triggers inventory sync
 * Run this on your DigitalOcean server with: node webhook-server.js
 */

const http = require('http');
const syncAllUsers = require('./sync-all-users');

const PORT = process.env.WEBHOOK_PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'change-this-secret-key';

// Track running syncs to prevent overlaps
let syncInProgress = false;
let lastSyncTime = null;
let lastSyncResult = null;

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check endpoint
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            syncInProgress,
            lastSyncTime,
            lastSyncResult
        }));
        return;
    }

    // Sync trigger endpoint
    if (req.url === '/trigger-sync' && req.method === 'POST') {
        // Verify secret
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${SECRET}`) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
            return;
        }

        // Check if sync is already running
        if (syncInProgress) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Sync already in progress',
                lastSyncTime
            }));
            return;
        }

        // Start sync in background
        syncInProgress = true;
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Sync started in background',
            estimatedTime: '2-5 minutes'
        }));

        // Run sync asynchronously
        syncAllUsers()
            .then(() => {
                syncInProgress = false;
                lastSyncTime = new Date().toISOString();
                lastSyncResult = 'success';
                console.log('Sync completed successfully');
            })
            .catch((error) => {
                syncInProgress = false;
                lastSyncTime = new Date().toISOString();
                lastSyncResult = 'error: ' + error.message;
                console.error('Sync failed:', error);
            });

        return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`🚀 Webhook server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Trigger sync: POST http://localhost:${PORT}/trigger-sync`);
    console.log(`Use Authorization: Bearer ${SECRET}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
