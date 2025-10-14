/**
 * GPB Sales Portal Scraper
 * Customized for https://www.gpbsales.com
 *
 * Scrapes:
 * 1. My Inventory page - regular inventory (serial, cash price, RTO price)
 * 2. Preowned Inventory page - repo buildings (same data)
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class GPBScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = {
            url: 'https://www.gpbsales.com',
            username: process.env.PORTAL_USERNAME,
            password: process.env.PORTAL_PASSWORD,
            headless: process.env.HEADLESS_MODE === 'true'
        };
    }

    async initialize() {
        console.log('Launching browser...');
        this.browser = await chromium.launch({
            headless: this.config.headless,
            slowMo: 100
        });

        this.page = await this.browser.newPage();
        await this.page.setViewportSize({ width: 1920, height: 1080 });

        // Create screenshots directory
        await fs.mkdir('screenshots', { recursive: true });
    }

    async login() {
        console.log('Navigating to GPB Sales login...');
        await this.page.goto(this.config.url, { waitUntil: 'networkidle' });
        await this.page.screenshot({ path: 'screenshots/01-gpb-homepage.png' });

        // Fill in credentials (NOT in iframe - on main page!)
        console.log('Entering credentials...');
        await this.page.waitForSelector('#email', { timeout: 10000 });

        // Fill username using ID
        await this.page.fill('#email', this.config.username);
        await this.page.waitForTimeout(500);

        // Fill password using ID
        await this.page.fill('#psw', this.config.password);
        await this.page.waitForTimeout(500);
        await this.page.screenshot({ path: 'screenshots/02-gpb-credentials-filled.png' });

        // Click the Login div (yes, it's a div, not a button!)
        console.log('Clicking Login div...');
        await this.page.click('div.button#login');

        // Wait for navigation - login can be slow
        console.log('Waiting for dashboard to load...');
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
        await this.page.waitForTimeout(5000); // Extra wait for dashboard to fully load

        await this.page.screenshot({ path: 'screenshots/03-gpb-logged-in.png' });

        // Verify we're logged in by checking for dashboard elements
        const loggedIn = await this.page.evaluate(() => {
            const text = document.body.textContent;
            return text.includes('MY INVENTORY') || text.includes('SIGN OUT') || text.includes('My Inventory');
        });

        if (!loggedIn) {
            console.log('Warning: Could not verify login success. Check screenshots/03-gpb-logged-in.png');
            // Don't fail - just continue and see what happens
        } else {
            console.log('Login successful!');
        }
    }

    async scrapeMyInventory() {
        console.log('\n=== Scraping My Inventory ===');

        // Click "MY INVENTORY" from the navigation menu (it's a link)
        console.log('Clicking MY INVENTORY link...');
        await this.page.click('a:has-text("MY"), a:has-text("INVENTORY")').catch(async () => {
            // Fallback: try clicking the div/text
            await this.page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                const myInvEl = elements.find(el =>
                    el.textContent.trim() === 'MY INVENTORY' ||
                    el.textContent.trim() === 'MY\nINVENTORY'
                );
                if (myInvEl) myInvEl.click();
            });
        });

        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000); // Let page fully load
        await this.page.screenshot({ path: 'screenshots/04-my-inventory.png' });

        const inventory = await this.page.evaluate(() => {
            const items = [];

            // Look for tables or rows containing inventory
            const rows = document.querySelectorAll('tr, .inventory-row, .building-row, [data-serial]');

            rows.forEach(row => {
                const text = row.textContent;

                // Broad serial number pattern: any 6 parts separated by dashes
                // Format: XX-XX-XXXXXX-XXXX-XXXXXX-XXX (with varying letter/number lengths)
                const serialMatch = text.match(/[A-Z0-9]{1,5}-[A-Z]{1,5}-\d{5,7}-\d{4}-\d{5,7}[A-Z0-9]{0,4}/);

                if (serialMatch) {
                    // Find all dollar amounts
                    const priceMatches = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];

                    const item = {
                        serialNumber: serialMatch[0],
                        rawText: text.trim(),
                        prices: priceMatches,
                        cashPrice: null,
                        rtoPrice: null
                    };

                    // Extract all prices
                    if (priceMatches.length > 0) {
                        const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));

                        // Largest price = cash price
                        item.cashPrice = Math.max(...prices);

                        // Extract RTO monthly prices (should be 4 values in order: 36, 48, 60, 72)
                        const rtoMonthly = prices.filter(p => p < item.cashPrice).sort((a, b) => b - a);

                        if (rtoMonthly.length >= 4) {
                            item.rto36 = rtoMonthly[0];
                            item.rto48 = rtoMonthly[1];
                            item.rto60 = rtoMonthly[2];
                            item.rto72 = rtoMonthly[3];
                        }
                    }

                    items.push(item);
                }
            });

            return items;
        });

        console.log(`Found ${inventory.length} items in My Inventory`);

        // Save for debugging
        await fs.writeFile(
            'screenshots/my-inventory-data.json',
            JSON.stringify(inventory, null, 2)
        );

        return inventory.map(item => ({ ...item, isRepo: false }));
    }

    async scrapePreownedInventory() {
        console.log('\n=== Scraping Preowned Inventory ===');

        // Click "PRE-OWNED INVENTORY" from the navigation menu
        try {
            console.log('Clicking PRE-OWNED INVENTORY link...');
            await this.page.click('a:has-text("PRE-OWNED"), a:has-text("PREOWNED")').catch(async () => {
                // Fallback
                await this.page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('*'));
                    const preownedEl = elements.find(el => {
                        const text = el.textContent.trim();
                        return text === 'PRE-OWNED INVENTORY' || text === 'PRE-OWNED\nINVENTORY';
                    });
                    if (preownedEl) preownedEl.click();
                });
            });

            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(3000);
            await this.page.screenshot({ path: 'screenshots/05-preowned-inventory.png' });
        } catch (e) {
            console.log('Could not find Pre-owned Inventory link:', e.message);
            return [];
        }

        const inventory = await this.page.evaluate(() => {
            const items = [];

            const rows = document.querySelectorAll('tr, .inventory-row, .building-row, [data-serial]');

            rows.forEach(row => {
                const text = row.textContent;

                // Broad serial number pattern: any 6 parts separated by dashes
                const serialMatch = text.match(/[A-Z0-9]{1,5}-[A-Z]{1,5}-\d{5,7}-\d{4}-\d{5,7}[A-Z0-9]{0,4}/);

                if (serialMatch) {
                    const priceMatches = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];

                    const item = {
                        serialNumber: serialMatch[0],
                        rawText: text.trim(),
                        prices: priceMatches,
                        cashPrice: null,
                        rtoPrice: null
                    };

                    // Extract all prices
                    if (priceMatches.length > 0) {
                        const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));

                        // Largest price = cash price
                        item.cashPrice = Math.max(...prices);

                        // Extract RTO monthly prices (should be 4 values in order: 36, 48, 60, 72)
                        const rtoMonthly = prices.filter(p => p < item.cashPrice).sort((a, b) => b - a);

                        if (rtoMonthly.length >= 4) {
                            item.rto36 = rtoMonthly[0];
                            item.rto48 = rtoMonthly[1];
                            item.rto60 = rtoMonthly[2];
                            item.rto72 = rtoMonthly[3];
                        }
                    }

                    items.push(item);
                }
            });

            return items;
        });

        console.log(`Found ${inventory.length} items in Preowned Inventory`);

        await fs.writeFile(
            'screenshots/preowned-inventory-data.json',
            JSON.stringify(inventory, null, 2)
        );

        return inventory.map(item => ({ ...item, isRepo: true }));
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    async run() {
        const allInventory = [];

        try {
            await this.initialize();
            await this.login();

            // Scrape both sections
            const myInventory = await this.scrapeMyInventory();
            const preownedInventory = await this.scrapePreownedInventory();

            allInventory.push(...myInventory, ...preownedInventory);

            // Clean up and format
            const formatted = allInventory.map(item => ({
                serialNumber: item.serialNumber,
                cashPrice: item.cashPrice || 0,
                rto36: item.rto36 || null,
                rto48: item.rto48 || null,
                rto60: item.rto60 || null,
                rto72: item.rto72 || null,
                isRepo: item.isRepo,
                location: 'GPB Sales', // Default, can be customized
                rawData: item.rawText
            }));

            console.log(`\n=== Total: ${formatted.length} buildings ===`);
            console.log(`Regular: ${formatted.filter(i => !i.isRepo).length}`);
            console.log(`Repo: ${formatted.filter(i => i.isRepo).length}`);

            return formatted;

        } catch (error) {
            console.error('GPB Scraper error:', error);
            // Only take screenshot if page exists
            if (this.page) {
                try {
                    await this.page.screenshot({ path: 'screenshots/ERROR-gpb-scrape.png' });
                } catch (screenshotError) {
                    console.error('Could not take error screenshot:', screenshotError.message);
                }
            }
            throw error;
        } finally {
            await this.close();
        }
    }
}

module.exports = GPBScraper;

// Allow running standalone for testing
if (require.main === module) {
    (async () => {
        const scraper = new GPBScraper();
        const inventory = await scraper.run();
        console.log('\nFinal inventory:');
        console.log(JSON.stringify(inventory, null, 2));
    })();
}
