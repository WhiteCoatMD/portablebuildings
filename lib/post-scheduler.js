/**
 * Facebook Post Scheduler
 * Calculates when to schedule posts based on user settings
 */

const { getPool } = require('./db');
const pool = getPool();

/**
 * Calculate next scheduled time for a post based on user's schedule settings
 * @param {number} userId
 * @param {object} scheduleSettings - User's schedule configuration
 * @returns {Date} Next scheduled post time
 */
function calculateNextPostTime(userId, scheduleSettings) {
    const {
        postFrequency = 'immediate',
        scheduleDays = [],
        schedStartTime = '09:00',
        schedEndTime = '17:00',
        maxPostsPerDay = '1'
    } = scheduleSettings;

    const now = new Date();

    // Immediate posting
    if (postFrequency === 'immediate') {
        return now;
    }

    // Daily posting - schedule for optimal time (10 AM tomorrow)
    if (postFrequency === 'daily') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        return tomorrow;
    }

    // 3-5 times per week - schedule for next available day
    if (postFrequency === '3-5week') {
        const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        return getNextScheduledTime(now, weekDays, schedStartTime, schedEndTime);
    }

    // Custom schedule
    if (postFrequency === 'custom' && scheduleDays.length > 0) {
        return getNextScheduledTime(now, scheduleDays, schedStartTime, schedEndTime);
    }

    // Default to immediate
    return now;
}

/**
 * Get next scheduled time based on selected days and time window
 */
function getNextScheduledTime(fromDate, allowedDays, startTime, endTime) {
    const dayMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
    };

    const allowedDayNumbers = allowedDays.map(d => dayMap[d.toLowerCase()]);

    // Parse time window
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let checkDate = new Date(fromDate);
    const maxDaysToCheck = 14; // Check up to 2 weeks ahead
    let daysChecked = 0;

    while (daysChecked < maxDaysToCheck) {
        const dayOfWeek = checkDate.getDay();

        if (allowedDayNumbers.includes(dayOfWeek)) {
            // This is an allowed day - calculate random time in window
            const scheduledTime = new Date(checkDate);

            // Random time between start and end
            const randomMinutes = Math.floor(
                Math.random() * ((endHour * 60 + endMin) - (startHour * 60 + startMin))
            ) + (startHour * 60 + startMin);

            scheduledTime.setHours(Math.floor(randomMinutes / 60), randomMinutes % 60, 0, 0);

            // If this time is in the future, use it
            if (scheduledTime > fromDate) {
                return scheduledTime;
            }
        }

        // Move to next day
        checkDate.setDate(checkDate.getDate() + 1);
        checkDate.setHours(0, 0, 0, 0);
        daysChecked++;
    }

    // Fallback to 24 hours from now
    const fallback = new Date(fromDate);
    fallback.setHours(fallback.getHours() + 24);
    return fallback;
}

/**
 * Add building to post queue
 */
async function addToPostQueue(userId, building, scheduleSettings) {
    try {
        const scheduledTime = calculateNextPostTime(userId, scheduleSettings);

        await pool.query(
            `INSERT INTO facebook_post_queue
             (user_id, building_serial_number, building_data, scheduled_time, status)
             VALUES ($1, $2, $3, $4, 'pending')
             ON CONFLICT (user_id, building_serial_number)
             DO UPDATE SET
                building_data = EXCLUDED.building_data,
                scheduled_time = EXCLUDED.scheduled_time,
                status = 'pending',
                attempts = 0,
                last_error = NULL`,
            [userId, building.serialNumber, JSON.stringify(building), scheduledTime]
        );

        console.log(`[Post Scheduler] Queued ${building.serialNumber} for ${scheduledTime.toISOString()}`);
        return { success: true, scheduledTime };

    } catch (error) {
        console.error('[Post Scheduler] Error adding to queue:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if we can post more today (respects maxPostsPerDay limit)
 */
async function canPostToday(userId, maxPostsPerDay) {
    if (maxPostsPerDay === 'unlimited') return true;

    const limit = parseInt(maxPostsPerDay) || 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await pool.query(
        `SELECT COUNT(*) as count FROM facebook_post_queue
         WHERE user_id = $1
         AND posted_at >= $2
         AND status = 'posted'`,
        [userId, today]
    );

    const postedToday = parseInt(result.rows[0].count);
    return postedToday < limit;
}

module.exports = {
    calculateNextPostTime,
    addToPostQueue,
    canPostToday
};
