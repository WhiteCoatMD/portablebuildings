/**
 * Building Status Tracker
 * Manages building lifecycle: available -> pending -> sold -> removed
 */

const fs = require('fs').promises;
const path = require('path');

class BuildingStatusTracker {
    constructor() {
        this.statusFile = path.join(__dirname, 'building-status.json');
        this.statuses = null;
    }

    /**
     * Load existing status data
     */
    async load() {
        try {
            const data = await fs.readFile(this.statusFile, 'utf-8');
            this.statuses = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, start fresh
            this.statuses = {
                buildings: {},
                lastSync: null
            };
        }
    }

    /**
     * Save status data to disk
     */
    async save() {
        await fs.writeFile(this.statusFile, JSON.stringify(this.statuses, null, 2));
    }

    /**
     * Process inventory changes and update statuses
     * @param {Array} currentInventory - Serial numbers currently in portal
     * @param {Object} options - Processing options (e.g., autoDeleteSold)
     * @returns {Object} Status updates to apply
     */
    async processInventoryChange(currentInventory, options = {}) {
        await this.load();

        const currentSerials = new Set(currentInventory.map(item => item.serialNumber));
        const previousSerials = new Set(Object.keys(this.statuses.buildings));
        const now = new Date().toISOString();

        // Default: auto-delete sold buildings after 72 hours (can be disabled via options)
        const autoDeleteSold = options.autoDeleteSold !== false;

        const updates = {
            newPending: [],
            newSold: [],
            toRemove: [],
            restored: []
        };

        // Find buildings that disappeared from inventory
        for (const serial of previousSerials) {
            if (!currentSerials.has(serial)) {
                const building = this.statuses.buildings[serial];

                if (!building.status || building.status === 'available') {
                    // First time missing - mark as pending
                    building.status = 'pending';
                    building.pendingSince = now;
                    building.missingSince = now;
                    updates.newPending.push(serial);
                    console.log(`📋 ${serial}: Marked as PENDING (first time missing)`);

                } else if (building.status === 'pending') {
                    // Still missing - mark as sold
                    building.status = 'sold';
                    building.soldAt = now;
                    updates.newSold.push(serial);
                    console.log(`✅ ${serial}: Marked as SOLD (still missing)`);
                }
            } else {
                // Building is back in inventory
                const building = this.statuses.buildings[serial];
                if (building && (building.status === 'pending' || building.status === 'sold')) {
                    building.status = 'available';
                    delete building.pendingSince;
                    delete building.missingSince;
                    delete building.soldAt;
                    updates.restored.push(serial);
                    console.log(`🔄 ${serial}: RESTORED to available`);
                }
            }
        }

        // Add new buildings that weren't tracked before
        for (const serial of currentSerials) {
            if (!this.statuses.buildings[serial]) {
                this.statuses.buildings[serial] = {
                    status: 'available',
                    firstSeen: now
                };
            }
        }

        // Check for sold buildings that should be removed (only if autoDeleteSold is enabled)
        if (autoDeleteSold) {
            const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
            for (const [serial, building] of Object.entries(this.statuses.buildings)) {
                if (building.status === 'sold' && building.soldAt) {
                    const soldTime = new Date(building.soldAt).getTime();
                    const hoursSinceSold = (Date.now() - soldTime) / 1000 / 60 / 60;

                    if (Date.now() - soldTime >= SEVENTY_TWO_HOURS) {
                        delete this.statuses.buildings[serial];
                        updates.toRemove.push(serial);
                        console.log(`🗑️  ${serial}: REMOVED (sold ${hoursSinceSold.toFixed(1)} hours ago)`);
                    }
                }
            }
        } else {
            console.log('⏸️  Auto-delete disabled: Sold buildings will remain until manually deleted');
        }

        this.statuses.lastSync = now;
        await this.save();

        return updates;
    }

    /**
     * Get current status overrides for admin panel
     * @returns {Object} Building overrides keyed by serial number
     */
    getStatusOverrides() {
        const overrides = {};

        for (const [serial, building] of Object.entries(this.statuses.buildings)) {
            if (building.status !== 'available') {
                overrides[serial] = {
                    status: building.status,
                    hidden: building.status === 'sold' && building.soldAt ? false : false,
                    metadata: {
                        pendingSince: building.pendingSince,
                        soldAt: building.soldAt,
                        missingSince: building.missingSince
                    }
                };
            }
        }

        return overrides;
    }

    /**
     * Get statistics about tracked buildings
     */
    getStats() {
        const stats = {
            total: 0,
            available: 0,
            pending: 0,
            sold: 0
        };

        for (const building of Object.values(this.statuses.buildings)) {
            stats.total++;
            stats[building.status]++;
        }

        return stats;
    }
}

module.exports = BuildingStatusTracker;
