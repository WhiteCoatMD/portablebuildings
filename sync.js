/**
 * Inventory Sync System
 * Pulls inventory from dealer portal and updates the website
 */

const GPBScraper = require('./gpb-scraper');
const BuildingStatusTracker = require('./status-tracker');
const fs = require('fs').promises;
const path = require('path');

class InventorySync {
    constructor() {
        this.scraper = new GPBScraper();
        this.statusTracker = new BuildingStatusTracker();
        this.inventoryFile = path.join(__dirname, 'inventory.js');
        this.backupDir = path.join(__dirname, 'backups');
    }

    async run() {
        console.log('=== Starting Inventory Sync ===');
        console.log(`Time: ${new Date().toISOString()}`);

        try {
            // Step 1: Backup current inventory
            await this.backupCurrentInventory();

            // Step 2: Scrape portal
            console.log('\nStep 1: Scraping dealer portal...');
            const scrapedData = await this.scraper.run();

            if (!scrapedData || scrapedData.length === 0) {
                throw new Error('No inventory data scraped from portal');
            }

            console.log(`Successfully scraped ${scrapedData.length} items`);

            // Step 3: Process status changes
            console.log('\nStep 2: Processing status changes...');
            const statusUpdates = await this.statusTracker.processInventoryChange(scrapedData);

            console.log(`  → ${statusUpdates.newPending.length} marked as PENDING`);
            console.log(`  → ${statusUpdates.newSold.length} marked as SOLD`);
            console.log(`  → ${statusUpdates.restored.length} RESTORED to available`);
            console.log(`  → ${statusUpdates.toRemove.length} REMOVED (sold 72+ hours ago)`);

            // Step 4: Format data
            console.log('\nStep 3: Formatting data...');
            const formattedInventory = this.formatInventory(scrapedData);

            // Step 5: Get status overrides
            const statusOverrides = this.statusTracker.getStatusOverrides();

            // Step 6: Update inventory.js with status data
            console.log('\nStep 4: Updating inventory.js...');
            await this.updateInventoryFile(formattedInventory, statusOverrides);

            // Step 7: Log success
            await this.logSync('success', formattedInventory.length, statusUpdates);

            const stats = this.statusTracker.getStats();
            console.log('\n=== Sync Complete ===');
            console.log(`Updated ${formattedInventory.length} items`);
            console.log(`Status: ${stats.available} available, ${stats.pending} pending, ${stats.sold} sold`);
            console.log('Website will show new inventory on next page load');

            return {
                success: true,
                count: formattedInventory.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('\n=== Sync Failed ===');
            console.error('Error:', error.message);
            await this.logSync('error', 0, error.message);

            // Restore from backup if available
            await this.restoreFromBackup();

            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async backupCurrentInventory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const backupPath = path.join(this.backupDir, `inventory-${timestamp}.js`);

            const currentInventory = await fs.readFile(this.inventoryFile, 'utf-8');
            await fs.writeFile(backupPath, currentInventory);

            console.log(`Backup created: ${backupPath}`);

            // Keep only last 30 backups
            await this.cleanOldBackups(30);

        } catch (error) {
            console.warn('Could not create backup:', error.message);
        }
    }

    async cleanOldBackups(keepCount) {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(f => f.startsWith('inventory-'))
                .sort()
                .reverse();

            if (backupFiles.length > keepCount) {
                const toDelete = backupFiles.slice(keepCount);
                for (const file of toDelete) {
                    await fs.unlink(path.join(this.backupDir, file));
                }
                console.log(`Cleaned up ${toDelete.length} old backups`);
            }
        } catch (error) {
            console.warn('Could not clean old backups:', error.message);
        }
    }

    async restoreFromBackup() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(f => f.startsWith('inventory-'))
                .sort()
                .reverse();

            if (backupFiles.length > 0) {
                const latestBackup = path.join(this.backupDir, backupFiles[0]);
                const backupContent = await fs.readFile(latestBackup, 'utf-8');
                await fs.writeFile(this.inventoryFile, backupContent);
                console.log('Restored from backup:', backupFiles[0]);
            }
        } catch (error) {
            console.error('Could not restore from backup:', error.message);
        }
    }

    formatInventory(scrapedData) {
        // Transform GPB scraped data into the format expected by inventory.js
        return scrapedData.map(item => {
            return {
                serialNumber: item.serialNumber,
                cashPrice: item.cashPrice || 0,
                rto36: item.rto36 || null,
                rto48: item.rto48 || null,
                rto60: item.rto60 || null,
                rto72: item.rto72 || null,
                price: item.cashPrice || 0, // Use cash price as default display price
                location: item.location || 'GPB Sales',
                isRepo: item.isRepo || false
            };
        });
    }

    async updateInventoryFile(inventory, statusOverrides = {}) {
        // Generate the inventory.js file content
        const content = `/**
 * Inventory Data
 * Last updated: ${new Date().toISOString()}
 * Auto-generated by sync system
 */

const INVENTORY = ${JSON.stringify(inventory, null, 4)};

const STATUS_OVERRIDES = ${JSON.stringify(statusOverrides, null, 4)};

/**
 * Process raw inventory data through the decoder
 * Returns enhanced inventory with decoded information and status overrides
 */
function processInventory() {
    return INVENTORY.map(item => {
        const decoder = new SerialNumberDecoder(item.serialNumber);
        const details = decoder.getFullDetails();

        if (!details.valid) {
            console.error('Invalid serial number:', item.serialNumber);
            return null;
        }

        // Apply status overrides from automatic tracking
        const override = STATUS_OVERRIDES[item.serialNumber] || {};

        return {
            ...item,
            ...details,
            typeCode: details.type.code,
            typeName: details.type.name,
            sizeDisplay: details.size.display,
            width: details.size.width,
            length: details.size.length,
            dateBuilt: details.dateBuilt.display,
            isRepo: details.status === 'repo',
            autoStatus: override.status || 'available',
            statusMetadata: override.metadata || {}
        };
    }).filter(item => item !== null);
}

// Merge auto-tracked status with admin overrides
function mergeWithAdminSettings() {
    const processed = processInventory();
    const adminOverrides = localStorage.getItem('cpb_building_overrides');

    if (!adminOverrides) return processed;

    const overrides = JSON.parse(adminOverrides);

    return processed.map(building => {
        const adminOverride = overrides[building.serialNumber];
        if (adminOverride) {
            // Admin overrides take precedence
            return {
                ...building,
                adminStatus: adminOverride.status,
                hidden: adminOverride.hidden
            };
        }
        return building;
    });
}

// Make available globally
window.PROCESSED_INVENTORY = processInventory();
`;

        await fs.writeFile(this.inventoryFile, content, 'utf-8');
        console.log('Inventory file updated successfully');
    }

    async logSync(status, count, error = null) {
        const logDir = path.join(__dirname, 'logs');
        await fs.mkdir(logDir, { recursive: true });

        const logEntry = {
            timestamp: new Date().toISOString(),
            status,
            count,
            error
        };

        const logFile = path.join(logDir, 'sync-log.json');

        try {
            let logs = [];
            try {
                const existing = await fs.readFile(logFile, 'utf-8');
                logs = JSON.parse(existing);
            } catch (e) {
                // File doesn't exist yet
            }

            logs.push(logEntry);

            // Keep only last 100 log entries
            if (logs.length > 100) {
                logs = logs.slice(-100);
            }

            await fs.writeFile(logFile, JSON.stringify(logs, null, 2));

        } catch (error) {
            console.error('Could not write log:', error.message);
        }
    }
}

// Export for use in scheduler
module.exports = InventorySync;

// Allow running standalone
if (require.main === module) {
    (async () => {
        const sync = new InventorySync();
        const result = await sync.run();
        console.log('\nResult:', result);
        process.exit(result.success ? 0 : 1);
    })();
}
