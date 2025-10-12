/**
 * Dealer Portal Scraper
 * Logs into the dealer portal and extracts inventory data
 *
 * IMPORTANT: You'll need to customize the selectors based on your actual portal
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class PortalScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = {
            url: process.env.PORTAL_URL,
            username: process.env.PORTAL_USERNAME,
            password: process.env.PORTAL_PASSWORD,
            inventoryUrl: process.env.INVENTORY_URL,
            headless: process.env.HEADLESS_MODE === 'true'
        };
    }

    async initialize() {
        console.log('Launching browser...');
        this.browser = await chromium.launch({
            headless: this.config.headless,
            slowMo: 100 // Slow down actions to appear more human
        });

        this.page = await this.browser.newPage();

        // Set a realistic user agent
        await this.page.setViewportSize({ width: 1920, height: 1080 });

        // Create screenshots directory if it doesn't exist
        await fs.mkdir('screenshots', { recursive: true });
    }

    async login() {
        console.log('Navigating to login page...');
        await this.page.goto(this.config.url, { waitUntil: 'networkidle' });

        // Take screenshot for debugging
        await this.page.screenshot({ path: 'screenshots/01-login-page.png' });

        console.log('Filling in credentials...');

        // TODO: CUSTOMIZE THESE SELECTORS FOR YOUR PORTAL
        // Common selectors to try:
        // - '#username', '#user', 'input[name="username"]', 'input[type="text"]'
        // - '#password', '#pass', 'input[name="password"]', 'input[type="password"]'
        // - 'button[type="submit"]', '#login-button', '.login-btn'

        try {
            // Wait for login form to be visible
            await this.page.waitForSelector('input[type="text"], input[name="username"], #username', { timeout: 10000 });

            // Try multiple common username selectors
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="user"]',
                '#username',
                '#user',
                'input[type="text"]'
            ];

            for (const selector of usernameSelectors) {
                try {
                    await this.page.fill(selector, this.config.username, { timeout: 2000 });
                    console.log(`Username filled using selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }

            // Try multiple common password selectors
            const passwordSelectors = [
                'input[name="password"]',
                'input[name="pass"]',
                '#password',
                '#pass',
                'input[type="password"]'
            ];

            for (const selector of passwordSelectors) {
                try {
                    await this.page.fill(selector, this.config.password, { timeout: 2000 });
                    console.log(`Password filled using selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }

            await this.page.screenshot({ path: 'screenshots/02-credentials-filled.png' });

            // Click login button
            const loginButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                '#login',
                '.login-button'
            ];

            for (const selector of loginButtonSelectors) {
                try {
                    await this.page.click(selector, { timeout: 2000 });
                    console.log(`Login button clicked using selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }

            // Wait for navigation after login
            await this.page.waitForLoadState('networkidle');
            await this.page.screenshot({ path: 'screenshots/03-after-login.png' });

            console.log('Login successful!');
            return true;

        } catch (error) {
            console.error('Login failed:', error.message);
            await this.page.screenshot({ path: 'screenshots/ERROR-login-failed.png' });
            throw new Error('Could not find login form elements. Check screenshots/ERROR-login-failed.png');
        }
    }

    async navigateToInventory() {
        console.log('Navigating to inventory page...');

        if (this.config.inventoryUrl && this.config.inventoryUrl !== this.config.url) {
            await this.page.goto(this.config.inventoryUrl, { waitUntil: 'networkidle' });
        }

        await this.page.screenshot({ path: 'screenshots/04-inventory-page.png' });
        console.log('Inventory page loaded. Check screenshots/04-inventory-page.png');
    }

    async scrapeInventory() {
        console.log('Scraping inventory data...');

        // TODO: CUSTOMIZE THIS FOR YOUR PORTAL
        // This is a generic scraper that tries to find tables

        try {
            // Wait for content to load
            await this.page.waitForTimeout(2000);

            // Try to find a table or list of inventory items
            const inventory = await this.page.evaluate(() => {
                const items = [];

                // Method 1: Try to find a table
                const table = document.querySelector('table');
                if (table) {
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length > 0) {
                            const rowData = {};
                            cells.forEach((cell, index) => {
                                rowData[`column_${index}`] = cell.textContent.trim();
                            });
                            items.push(rowData);
                        }
                    });
                }

                // Method 2: Try to find div-based inventory cards
                if (items.length === 0) {
                    const cards = document.querySelectorAll('.inventory-item, .product-card, [data-serial]');
                    cards.forEach(card => {
                        items.push({
                            html: card.innerHTML,
                            text: card.textContent.trim()
                        });
                    });
                }

                return items;
            });

            console.log(`Found ${inventory.length} items`);

            // Save raw data for inspection
            await fs.writeFile(
                'screenshots/raw-inventory-data.json',
                JSON.stringify(inventory, null, 2)
            );

            console.log('Raw data saved to screenshots/raw-inventory-data.json');

            return inventory;

        } catch (error) {
            console.error('Error scraping inventory:', error.message);
            await this.page.screenshot({ path: 'screenshots/ERROR-scrape-failed.png' });
            throw error;
        }
    }

    async parseInventoryData(rawData) {
        console.log('Parsing inventory data...');

        // TODO: CUSTOMIZE THIS BASED ON YOUR PORTAL'S DATA FORMAT
        // This function should extract serial numbers, prices, etc.

        const parsedInventory = [];

        for (const item of rawData) {
            // Try to find serial number in the text
            const text = JSON.stringify(item);
            const serialMatch = text.match(/P5-[A-Z]{2}-\d{6}-\d{4}-\d{6}-[A-Z]{2,3}R?/);

            if (serialMatch) {
                parsedInventory.push({
                    serialNumber: serialMatch[0],
                    rawData: item,
                    // Add more fields as needed:
                    // price: extractPrice(item),
                    // location: extractLocation(item),
                });
            }
        }

        console.log(`Parsed ${parsedInventory.length} valid items with serial numbers`);
        return parsedInventory;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    async run() {
        try {
            await this.initialize();
            await this.login();
            await this.navigateToInventory();
            const rawData = await this.scrapeInventory();
            const inventory = await this.parseInventoryData(rawData);

            return inventory;

        } catch (error) {
            console.error('Scraper error:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

module.exports = PortalScraper;

// Allow running standalone for testing
if (require.main === module) {
    (async () => {
        const scraper = new PortalScraper();
        const inventory = await scraper.run();
        console.log('Final inventory:', inventory);
    })();
}
