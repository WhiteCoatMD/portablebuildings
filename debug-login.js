// Quick debug script to inspect the login page HTML
const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.gpbsales.com');
    await page.waitForLoadState('networkidle');

    //Fill credentials
    await page.fill('input[type="text"]', process.env.PORTAL_USERNAME);
    await page.fill('input[type="password"]', process.env.PORTAL_PASSWORD);

    // Get the HTML
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('login-page.html', html);

    // Get all buttons
    const buttons = await page.$$eval('button, input[type="submit"], input[type="button"]', els =>
        els.map(el => ({
            tag: el.tagName,
            type: el.type,
            id: el.id,
            class: el.className,
            text: el.textContent || el.value,
            visible: el.offsetParent !== null
        }))
    );

    console.log('Found buttons:', JSON.stringify(buttons, null, 2));

    console.log('\nPress any key to close...');
    await page.waitForTimeout(60000);
    await browser.close();
})();
