/**
 * Helper utilities for common test operations
 */

const fs = require('fs');
const path = require('path');

class Helpers {
    /**
     * Wait for specified time
     * @param {number} milliseconds - Time to wait
     * @returns {Promise<void>}
     */
    static async wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Retry operation with exponential backoff
     * @param {Function} operation - Operation to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} initialDelay - Initial delay in milliseconds
     * @returns {Promise<any>} Operation result
     */
    static async retryWithBackoff(operation, maxRetries = 3, initialDelay = 1000) {
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    const delay = initialDelay * Math.pow(2, i);
                    console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
                    await this.wait(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Get timestamp in specified format
     * @param {string} format - Format (default: 'YYYY-MM-DD_HH-MM-SS')
     * @returns {string} Formatted timestamp
     */
    static getTimestamp(format = 'YYYY-MM-DD_HH-MM-SS') {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('MM', minutes)
            .replace('SS', seconds);
    }

    /**
     * Create directory if it doesn't exist
     * @param {string} dirPath - Directory path
     */
    static ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Read JSON file
     * @param {string} filePath - File path
     * @returns {Object} Parsed JSON
     */
    static readJsonFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading JSON file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Write JSON file
     * @param {string} filePath - File path
     * @param {Object} data - Data to write
     */
    static writeJsonFile(filePath, data) {
        try {
            this.ensureDirectoryExists(path.dirname(filePath));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error writing JSON file ${filePath}:`, error);
        }
    }

    /**
     * Clean old files in directory
     * @param {string} dirPath - Directory path
     * @param {number} daysOld - Remove files older than this many days
     */
    static cleanOldFiles(dirPath, daysOld = 7) {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        const files = fs.readdirSync(dirPath);
        const now = Date.now();
        const maxAge = daysOld * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old file: ${file}`);
            }
        });
    }

    /**
     * Sanitize filename
     * @param {string} filename - Filename to sanitize
     * @returns {string} Sanitized filename
     */
    static sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    }

    /**
     * Compare two objects deeply
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {boolean} True if objects are equal
     */
    static deepEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    /**
     * Get environment variable with default value
     * @param {string} key - Environment variable key
     * @param {string} defaultValue - Default value if not found
     * @returns {string} Environment variable value
     */
    static getEnvVariable(key, defaultValue = '') {
        return process.env[key] || defaultValue;
    }

    /**
     * Format duration in milliseconds to readable format
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    static formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    static generateUniqueId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Mask sensitive data
     * @param {string} data - Data to mask
     * @param {number} visibleChars - Number of visible characters
     * @returns {string} Masked data
     */
    static maskSensitiveData(data, visibleChars = 4) {
        if (!data || data.length <= visibleChars) {
            return '****';
        }
        return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
    }

    /**
     * Check if string is valid email
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if string is valid URL
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Truncate string to specified length
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated string
     */
    static truncateString(str, length = 50) {
        if (str.length <= length) {
            return str;
        }
        return str.slice(0, length) + '...';
    }
}

module.exports = Helpers;
