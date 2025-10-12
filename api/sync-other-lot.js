/**
 * API endpoint to scrape inventory from another lot's GPB Sales account
 * This runs the Playwright scraper with different credentials
 */

const { chromium } = require('playwright');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    console.log('Sync other lot request received');

    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { username, password, lotName } = body;

    if (!username || !password || !lotName) {
      return res.status(400).json({
        success: false,
        error: 'Missing username, password, or lot name'
      });
    }

    console.log('Starting scraper for lot:', lotName);

    // Launch browser
    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Login to GPB Sales
    console.log('Navigating to GPB Sales...');
    await page.goto('https://www.gpbsales.com', { waitUntil: 'networkidle' });

    console.log('Entering credentials for', lotName);
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.fill('#email', username);
    await page.waitForTimeout(500);
    await page.fill('#psw', password);
    await page.waitForTimeout(500);

    console.log('Logging in...');
    await page.click('div.button#login');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Verify login
    const loggedIn = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('MY INVENTORY') || text.includes('SIGN OUT') || text.includes('My Inventory');
    });

    if (!loggedIn) {
      throw new Error('Login failed - check credentials');
    }

    console.log('Login successful, scraping inventory...');

    // Scrape My Inventory
    await page.click('a:has-text("MY"), a:has-text("INVENTORY")').catch(async () => {
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const myInvEl = elements.find(el =>
          el.textContent.trim() === 'MY INVENTORY' ||
          el.textContent.trim() === 'MY\nINVENTORY'
        );
        if (myInvEl) myInvEl.click();
      });
    });

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const inventory = await page.evaluate(() => {
      const items = [];
      const rows = document.querySelectorAll('tr, .inventory-row, .building-row, [data-serial]');

      rows.forEach(row => {
        const text = row.textContent;
        const serialMatch = text.match(/[A-Z0-9]{1,5}-[A-Z]{1,5}-\d{5,7}-\d{4}-\d{5,7}[A-Z0-9]{0,4}/);

        if (serialMatch) {
          const priceMatches = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
          const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));

          const item = {
            serialNumber: serialMatch[0],
            cashPrice: prices.length > 0 ? Math.max(...prices) : 0,
            isRepo: false
          };

          // Extract RTO prices
          const rtoMonthly = prices.filter(p => p < item.cashPrice).sort((a, b) => b - a);
          if (rtoMonthly.length >= 4) {
            item.rto36 = rtoMonthly[0];
            item.rto48 = rtoMonthly[1];
            item.rto60 = rtoMonthly[2];
            item.rto72 = rtoMonthly[3];
          }

          items.push(item);
        }
      });

      return items;
    });

    console.log(`Found ${inventory.length} items for ${lotName}`);

    // Try to get preowned inventory
    let preownedInventory = [];
    try {
      await page.click('a:has-text("PRE-OWNED"), a:has-text("PREOWNED")').catch(async () => {
        await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          const preownedEl = elements.find(el => {
            const text = el.textContent.trim();
            return text === 'PRE-OWNED INVENTORY' || text === 'PRE-OWNED\nINVENTORY';
          });
          if (preownedEl) preownedEl.click();
        });
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      preownedInventory = await page.evaluate(() => {
        const items = [];
        const rows = document.querySelectorAll('tr, .inventory-row, .building-row, [data-serial]');

        rows.forEach(row => {
          const text = row.textContent;
          const serialMatch = text.match(/[A-Z0-9]{1,5}-[A-Z]{1,5}-\d{5,7}-\d{4}-\d{5,7}[A-Z0-9]{0,4}/);

          if (serialMatch) {
            const priceMatches = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
            const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));

            const item = {
              serialNumber: serialMatch[0],
              cashPrice: prices.length > 0 ? Math.max(...prices) : 0,
              isRepo: true
            };

            const rtoMonthly = prices.filter(p => p < item.cashPrice).sort((a, b) => b - a);
            if (rtoMonthly.length >= 4) {
              item.rto36 = rtoMonthly[0];
              item.rto48 = rtoMonthly[1];
              item.rto60 = rtoMonthly[2];
              item.rto72 = rtoMonthly[3];
            }

            items.push(item);
          }
        });

        return items;
      });

      console.log(`Found ${preownedInventory.length} preowned items`);
    } catch (e) {
      console.log('No preowned inventory found');
    }

    await browser.close();

    const allInventory = [...inventory, ...preownedInventory].map(item => ({
      ...item,
      price: item.cashPrice,
      location: lotName
    }));

    console.log(`Total: ${allInventory.length} buildings scraped from ${lotName}`);

    return res.status(200).json({
      success: true,
      inventory: allInventory,
      count: allInventory.length
    });

  } catch (error) {
    console.error('Sync other lot error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to sync lot',
      details: error.message
    });
  }
};
