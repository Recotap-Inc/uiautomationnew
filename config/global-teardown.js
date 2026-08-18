/**
 * Global Teardown
 * Runs once after all tests
 * Use this for:
 * - Cleanup operations
 * - Stopping services
 * - Generating reports
 * - Sending notifications
 */

const { logger } = require('../utils/logger');
const Helpers = require('../utils/helpers');

async function globalTeardown() {
    logger.info('===== GLOBAL TEARDOWN STARTED =====');

    try {
        // Example: Clean old reports
        cleanOldReports();

        // Example: Generate summary
        generateTestSummary();

        // Example: Send notifications (if configured)
        // await sendNotifications();

        logger.success('===== GLOBAL TEARDOWN COMPLETED =====');
    } catch (error) {
        logger.error('Global teardown failed', error);
    }
}

/**
 * Clean old report files
 */
function cleanOldReports() {
    try {
        const daysToKeep = 7;

        Helpers.cleanOldFiles('reports/logs', daysToKeep);
        Helpers.cleanOldFiles('reports/screenshots', daysToKeep);

        logger.info(`Cleaned reports older than ${daysToKeep} days`);
    } catch (error) {
        logger.warning('Could not clean old reports', error);
    }
}

/**
 * Generate test execution summary
 */
function generateTestSummary() {
    try {
        const fs = require('fs');
        const path = require('path');

        const resultsPath = path.join(process.cwd(), 'reports', 'test-results.json');

        if (fs.existsSync(resultsPath)) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

            const summary = {
                timestamp: new Date().toISOString(),
                total: results.stats?.expected || 0,
                passed: results.stats?.expected || 0,
                failed: results.stats?.unexpected || 0,
                skipped: results.stats?.skipped || 0,
                duration: Helpers.formatDuration(results.stats?.duration || 0)
            };

            logger.info('Test Summary:', summary);

            // Save summary
            const summaryPath = path.join(process.cwd(), 'reports', 'summary.json');
            Helpers.writeJsonFile(summaryPath, summary);
        }
    } catch (error) {
        logger.warning('Could not generate test summary', error);
    }
}

/**
 * Send test notifications (example)
 */
async function sendNotifications() {
    // Example: Send Slack notification
    // Example: Send email
    // Example: Update test management system
    logger.info('Notifications sent (if configured)');
}

module.exports = globalTeardown;
