/**
 * Logger utility for test execution logging
 * Provides structured logging with timestamps and log levels
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'reports', 'logs');
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get formatted timestamp
     * @returns {string} Formatted timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Get log file path for current date
     * @returns {string} Log file path
     */
    getLogFilePath() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `test-execution-${date}.log`);
    }

    /**
     * Write log to file and console
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {any} data - Additional data
     */
    log(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const logMessage = data
            ? `[${timestamp}] [${level}] ${message} ${JSON.stringify(data, null, 2)}`
            : `[${timestamp}] [${level}] ${message}`;

        // Console output with color
        this.consoleLog(level, logMessage);

        // File output
        try {
            fs.appendFileSync(this.getLogFilePath(), logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Console log with colors based on level
     * @param {string} level - Log level
     * @param {string} message - Log message
     */
    consoleLog(level, message) {
        const colors = {
            INFO: '\x1b[36m',    // Cyan
            SUCCESS: '\x1b[32m', // Green
            WARNING: '\x1b[33m', // Yellow
            ERROR: '\x1b[31m',   // Red
            DEBUG: '\x1b[90m'    // Gray
        };

        const reset = '\x1b[0m';
        const color = colors[level] || reset;

        console.log(`${color}${message}${reset}`);
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     * @param {any} data - Additional data
     */
    info(message, data = null) {
        this.log('INFO', message, data);
    }

    /**
     * Log success message
     * @param {string} message - Message to log
     * @param {any} data - Additional data
     */
    success(message, data = null) {
        this.log('SUCCESS', message, data);
    }

    /**
     * Log warning message
     * @param {string} message - Message to log
     * @param {any} data - Additional data
     */
    warning(message, data = null) {
        this.log('WARNING', message, data);
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {any} data - Additional data
     */
    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    /**
     * Log debug message
     * @param {string} message - Message to log
     * @param {any} data - Additional data
     */
    debug(message, data = null) {
        if (process.env.DEBUG === 'true') {
            this.log('DEBUG', message, data);
        }
    }

    /**
     * Log test start
     * @param {string} testName - Test name
     */
    testStart(testName) {
        this.info(`\n${'='.repeat(80)}\n🧪 TEST STARTED: ${testName}\n${'='.repeat(80)}`);
    }

    /**
     * Log test end
     * @param {string} testName - Test name
     * @param {string} status - Test status (passed/failed)
     */
    testEnd(testName, status) {
        const emoji = status === 'passed' ? '✅' : '❌';
        this.info(`\n${emoji} TEST ${status.toUpperCase()}: ${testName}\n${'='.repeat(80)}\n`);
    }
}

// Export singleton instance
const logger = new Logger();
module.exports = { logger };
