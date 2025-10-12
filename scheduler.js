/**
 * Scheduler for Automated Inventory Sync
 * Runs the sync daily at a specified time
 */

const cron = require('node-cron');
const InventorySync = require('./sync');
require('dotenv').config();

class Scheduler {
    constructor() {
        this.sync = new InventorySync();
        // Default: Run every day at 2:00 AM
        // Format: second minute hour day month weekday
        this.cronSchedule = process.env.CRON_SCHEDULE || '0 2 * * *';
    }

    start() {
        console.log('=== Inventory Sync Scheduler Started ===');
        console.log(`Schedule: ${this.cronSchedule}`);
        console.log(`Next run: ${this.getNextRunTime()}\n`);

        // Schedule the recurring job
        const task = cron.schedule(this.cronSchedule, async () => {
            console.log('\n--- Scheduled sync triggered ---');
            await this.runSync();
        });

        // Run once immediately on startup (optional)
        if (process.env.RUN_ON_STARTUP === 'true') {
            console.log('Running initial sync on startup...\n');
            this.runSync();
        }

        // Keep the process running
        console.log('Scheduler is running. Press Ctrl+C to stop.\n');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down scheduler...');
            task.stop();
            process.exit(0);
        });
    }

    async runSync() {
        try {
            const result = await this.sync.run();

            if (result.success) {
                console.log(`\nNext sync: ${this.getNextRunTime()}`);
            } else {
                console.error('\nSync failed, will retry on next scheduled run');
            }

            return result;

        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }

    getNextRunTime() {
        // Calculate next run time based on cron schedule
        const now = new Date();
        const [minute, hour] = this.cronSchedule.split(' ').slice(1, 3);

        const next = new Date();
        next.setHours(parseInt(hour), parseInt(minute), 0, 0);

        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        return next.toLocaleString();
    }
}

// Run the scheduler
if (require.main === module) {
    const scheduler = new Scheduler();
    scheduler.start();
}

module.exports = Scheduler;
