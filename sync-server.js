/**
 * Local Sync Server
 * Runs locally and accepts sync requests from the admin panel
 * This allows the admin panel to trigger scraping without needing Vercel to run Playwright
 */

const express = require('express');
const cors = require('cors');
const GPBScraper = require('./gpb-scraper');
const { SerialNumberDecoder } = require('./decoder');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || process.env.SYNC_SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Webhook secret for security
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'change-this-secret';

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sync server is running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'GPB Sales Sync Server',
        status: 'running',
        endpoints: {
            health: 'GET /health',
            sync: 'POST /sync-lot (requires authentication)'
        }
    });
});

// Sync lot endpoint
app.post('/sync-lot', async (req, res) => {
    // Verify webhook secret for security
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== WEBHOOK_SECRET) {
        console.log('Unauthorized sync attempt - invalid webhook secret');
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    const { username, password, lotName, userId } = req.body;

    if (!username || !password || !lotName) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    console.log(`\n[${new Date().toISOString()}] Sync request received for: ${lotName} (User ID: ${userId || 'unknown'})`);

    try {
        // Create scraper with provided credentials
        const scraper = new GPBScraper();
        scraper.config.username = username;
        scraper.config.password = password;

        console.log('Starting scrape...');
        const scrapedData = await scraper.run();

        if (!scrapedData || scrapedData.length === 0) {
            throw new Error('No inventory found');
        }

        console.log(`Successfully scraped ${scrapedData.length} buildings`);

        // Decode serial numbers and enrich data
        const enrichedData = scrapedData.map(item => {
            const decoder = new SerialNumberDecoder(item.serialNumber);
            const decoded = decoder.getFullDetails();

            if (decoded.valid) {
                return {
                    serialNumber: item.serialNumber,
                    type_code: decoded.type.code,
                    type_name: decoded.type.name,
                    title: decoded.title,
                    size_display: decoded.size.display,
                    width: decoded.size.width,
                    length: decoded.size.length,
                    date_built: decoded.dateBuilt.display,
                    price: item.cashPrice || 0,
                    cashPrice: item.cashPrice || 0,
                    rto36: item.rto36 || 0,
                    rto48: item.rto48 || 0,
                    rto60: item.rto60 || 0,
                    rto72: item.rto72 || 0,
                    location: lotName,
                    isRepo: item.isRepo || decoded.status === 'repo'
                };
            } else {
                // If decoder fails, return raw data with defaults
                console.warn(`Failed to decode serial: ${item.serialNumber}`);
                return {
                    serialNumber: item.serialNumber,
                    type_code: '',
                    type_name: 'Unknown',
                    title: item.serialNumber,
                    size_display: '',
                    width: null,
                    length: null,
                    date_built: '',
                    price: item.cashPrice || 0,
                    cashPrice: item.cashPrice || 0,
                    rto36: item.rto36 || 0,
                    rto48: item.rto48 || 0,
                    rto60: item.rto60 || 0,
                    rto72: item.rto72 || 0,
                    location: lotName,
                    isRepo: item.isRepo || false
                };
            }
        });

        // Return enriched data with decoded serial information
        res.json({
            success: true,
            inventory: enrichedData,
            count: enrichedData.length,
            lotName
        });

    } catch (error) {
        console.error('Sync error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Portable Buildings Sync Server                  ║
║                                                           ║
║  Status: RUNNING                                          ║
║  Port: ${PORT}                                               ║
║                                                           ║
║  The admin panel can now trigger lot syncs!              ║
║  Keep this server running in the background.             ║
║                                                           ║
║  To stop: Press Ctrl+C                                   ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down sync server...');
    process.exit(0);
});
