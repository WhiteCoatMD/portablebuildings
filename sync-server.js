/**
 * Local Sync Server
 * Runs locally and accepts sync requests from the admin panel
 * This allows the admin panel to trigger scraping without needing Vercel to run Playwright
 */

const express = require('express');
const cors = require('cors');
const GPBScraper = require('./gpb-scraper');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.SYNC_SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sync server is running' });
});

// Sync lot endpoint
app.post('/sync-lot', async (req, res) => {
    const { username, password, lotName } = req.body;

    if (!username || !password || !lotName) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    console.log(`\n[${new Date().toISOString()}] Sync request received for: ${lotName}`);

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

        // Return the data - let the client handle the tagging
        res.json({
            success: true,
            inventory: scrapedData.map(item => ({
                serialNumber: item.serialNumber,
                cashPrice: item.cashPrice,
                rto36: item.rto36,
                rto48: item.rto48,
                rto60: item.rto60,
                rto72: item.rto72,
                price: item.cashPrice,
                location: lotName,
                isRepo: item.isRepo
            })),
            count: scrapedData.length,
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
