/**
 * Smart Template Selection for Facebook Posts
 * - Prevents template repetition within 10 days
 * - Ensures weekend sale templates only post on Friday/Saturday
 */

const crypto = require('crypto');
const { getPool } = require('./db');
const pool = getPool();

/**
 * Generate hash for template to track uniqueness
 */
function hashTemplate(templateText) {
    return crypto.createHash('sha256')
        .update(templateText.toLowerCase().trim())
        .digest('hex');
}

/**
 * Check if template mentions weekend sale
 */
function isWeekendTemplate(templateText) {
    const lowerText = templateText.toLowerCase();
    const weekendKeywords = [
        'weekend sale',
        'weekend special',
        'weekend only',
        'weekend deal',
        'this weekend',
        'saturday sale',
        'saturday special',
        'friday sale',
        'friday special',
        'weekend promo'
    ];

    return weekendKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if a day is Friday or Saturday
 */
function isWeekendPostDay(date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // 5 = Friday, 6 = Saturday
}

/**
 * Check if template can be used (not used within 10 days)
 * @param {number} userId
 * @param {string} templateText
 * @param {boolean} isManual - Manual posts bypass the 10-day rule
 * @returns {Promise<{canUse: boolean, reason: string}>}
 */
async function canUseTemplate(userId, templateText, isManual = false) {
    try {
        // Manual posts can always use any template
        if (isManual) {
            return { canUse: true, reason: 'Manual post - no restrictions' };
        }

        const templateHash = hashTemplate(templateText);
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        // Check if this template was used in the last 10 days
        const result = await pool.query(
            `SELECT used_at FROM template_usage
             WHERE user_id = $1
             AND template_hash = $2
             AND used_at >= $3
             AND is_manual = false
             ORDER BY used_at DESC
             LIMIT 1`,
            [userId, templateHash, tenDaysAgo]
        );

        if (result.rows.length > 0) {
            const lastUsed = new Date(result.rows[0].used_at);
            const daysSince = Math.floor((new Date() - lastUsed) / (1000 * 60 * 60 * 24));
            return {
                canUse: false,
                reason: `Template used ${daysSince} days ago (need 10+ days)`
            };
        }

        return { canUse: true, reason: 'Template available' };

    } catch (error) {
        console.error('[Template Selector] Error checking template availability:', error);
        // On error, allow the template to be safe
        return { canUse: true, reason: 'Check failed - allowing template' };
    }
}

/**
 * Check if template is appropriate for the scheduled day
 * @param {string} templateText
 * @param {Date} scheduledDate
 * @returns {{canUse: boolean, reason: string}}
 */
function isAppropriateForDay(templateText, scheduledDate) {
    const isWeekend = isWeekendTemplate(templateText);

    if (isWeekend && !isWeekendPostDay(scheduledDate)) {
        const dayName = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
        return {
            canUse: false,
            reason: `Weekend template cannot post on ${dayName}`
        };
    }

    return { canUse: true, reason: 'Template appropriate for this day' };
}

/**
 * Select best template for posting
 * @param {number} userId
 * @param {Array<string>} templates - Array of available templates
 * @param {Date} scheduledDate
 * @param {boolean} isManual
 * @returns {Promise<{template: string, reason: string}>}
 */
async function selectBestTemplate(userId, templates, scheduledDate, isManual = false) {
    if (!templates || templates.length === 0) {
        return {
            template: null,
            reason: 'No templates available'
        };
    }

    // Try each template in order
    for (const template of templates) {
        // Check if template is appropriate for the day (weekend check)
        const dayCheck = isAppropriateForDay(template, scheduledDate);
        if (!dayCheck.canUse && !isManual) {
            console.log(`[Template Selector] Skipping template: ${dayCheck.reason}`);
            continue;
        }

        // Check if template can be used (10-day rule)
        const usageCheck = await canUseTemplate(userId, template, isManual);
        if (!usageCheck.canUse) {
            console.log(`[Template Selector] Skipping template: ${usageCheck.reason}`);
            continue;
        }

        // This template passes all checks!
        return {
            template,
            reason: `Selected: ${dayCheck.reason}, ${usageCheck.reason}`
        };
    }

    // No templates available - fallback to first template if manual
    if (isManual && templates.length > 0) {
        return {
            template: templates[0],
            reason: 'Manual post - using first template (bypassing all rules)'
        };
    }

    return {
        template: null,
        reason: 'No suitable templates found (all used recently or wrong day)'
    };
}

/**
 * Record template usage
 * @param {number} userId
 * @param {string} templateText
 * @param {boolean} isManual
 * @param {string} buildingSerial
 */
async function recordTemplateUsage(userId, templateText, isManual = false, buildingSerial = null) {
    try {
        const templateHash = hashTemplate(templateText);

        await pool.query(
            `INSERT INTO template_usage
             (user_id, template_text, template_hash, is_manual, building_serial, used_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [userId, templateText, templateHash, isManual, buildingSerial]
        );

        console.log(`[Template Selector] Recorded template usage for user ${userId}, manual=${isManual}`);

    } catch (error) {
        console.error('[Template Selector] Error recording template usage:', error);
        // Don't throw - this is logging only
    }
}

/**
 * Get template usage history for a user
 * @param {number} userId
 * @param {number} days - Number of days to look back
 */
async function getTemplateHistory(userId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await pool.query(
            `SELECT
                template_text,
                used_at,
                is_manual,
                building_serial
             FROM template_usage
             WHERE user_id = $1
             AND used_at >= $2
             ORDER BY used_at DESC`,
            [userId, startDate]
        );

        return result.rows;

    } catch (error) {
        console.error('[Template Selector] Error getting template history:', error);
        return [];
    }
}

module.exports = {
    hashTemplate,
    isWeekendTemplate,
    isWeekendPostDay,
    canUseTemplate,
    isAppropriateForDay,
    selectBestTemplate,
    recordTemplateUsage,
    getTemplateHistory
};
