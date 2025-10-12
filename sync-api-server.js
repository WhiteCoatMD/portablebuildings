/**
 * Sync API Server
 * Runs on DigitalOcean and accepts manual sync trigger requests
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.SYNC_API_PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sync API server is running' });
});

// Trigger manual sync
app.post('/trigger-sync', async (req, res) => {
    console.log(`\n[${new Date().toISOString()}] Manual sync triggered`);

    try {
        // Run the sync script
        const syncScript = path.join(__dirname, 'sync.js');

        exec(`node "${syncScript}"`, {
            cwd: __dirname,
            env: { ...process.env }
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('Sync error:', error);
                console.error('stderr:', stderr);
            } else {
                console.log('Sync output:', stdout);
            }
        });

        // Return immediately (sync runs in background)
        res.json({
            success: true,
            message: 'Sync started in background. Check logs in a few minutes.',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to start sync:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Sync API Server                                 ║
║                                                           ║
║  Status: RUNNING                                          ║
║  Port: ${PORT}                                               ║
║                                                           ║
║  Admin panel can now trigger manual syncs!               ║
║                                                           ║
║  Endpoints:                                              ║
║  - GET  /health        - Health check                    ║
║  - POST /trigger-sync  - Trigger manual sync             ║
║                                                           ║
║  To stop: Press Ctrl+C                                   ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down sync API server...');
    process.exit(0);
});
