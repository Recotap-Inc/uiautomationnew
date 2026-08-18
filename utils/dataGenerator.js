/**
 * Data Generator utility
 * Generates random test data for various scenarios
 */

class DataGenerator {
    /**
     * Generate random email
     * @param {string} domain - Email domain (optional)
     * @returns {string} Random email
     */
    static generateEmail(domain = 'test.com') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `test_${timestamp}_${random}@${domain}`;
    }

    /**
     * Generate random password
     * @param {number} length - Password length
     * @param {boolean} includeSpecialChars - Include special characters
     * @returns {string} Random password
     */
    static generatePassword(length = 12, includeSpecialChars = true) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let chars = uppercase + lowercase + numbers;
        if (includeSpecialChars) {
            chars += special;
        }

        let password = '';
        // Ensure at least one of each required type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];

        if (includeSpecialChars) {
            password += special[Math.floor(Math.random() * special.length)];
        }

        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Generate random string
     * @param {number} length - String length
     * @returns {string} Random string
     */
    static generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate random number
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    static generateRandomNumber(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random phone number
     * @param {string} format - Phone format (optional)
     * @returns {string} Random phone number
     */
    static generatePhoneNumber(format = 'US') {
        if (format === 'US') {
            const areaCode = this.generateRandomNumber(200, 999);
            const prefix = this.generateRandomNumber(200, 999);
            const lineNumber = this.generateRandomNumber(1000, 9999);
            return `(${areaCode}) ${prefix}-${lineNumber}`;
        }
        return `${this.generateRandomNumber(1000000000, 9999999999)}`;
    }

    /**
     * Generate random date
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Date} Random date
     */
    static generateRandomDate(startDate = new Date(2020, 0, 1), endDate = new Date()) {
        const start = startDate.getTime();
        const end = endDate.getTime();
        return new Date(start + Math.random() * (end - start));
    }

    /**
     * Generate random boolean
     * @returns {boolean} Random boolean
     */
    static generateRandomBoolean() {
        return Math.random() < 0.5;
    }

    /**
     * Select random item from array
     * @param {Array} array - Array to select from
     * @returns {any} Random item
     */
    static selectRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Generate invalid emails for testing
     * @returns {Array<string>} Array of invalid emails
     */
    static getInvalidEmails() {
        return [
            'notanemail',
            'test@',
            '@domain.com',
            'test space@domain.com',
            'test..double@domain.com',
            'test@domain',
            'test@.com',
            ''
        ];
    }

    /**
     * Generate XSS payloads for security testing
     * @returns {Array<string>} Array of XSS payloads
     */
    static getXSSPayloads() {
        return [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '<svg/onload=alert("XSS")>',
            '"><script>alert("XSS")</script>'
        ];
    }

    /**
     * Generate SQL injection payloads for security testing
     * @returns {Array<string>} Array of SQL injection payloads
     */
    static getSQLInjectionPayloads() {
        return [
            "' OR '1'='1",
            "'; DROP TABLE users--",
            "admin'--",
            "' OR 1=1--",
            "1' UNION SELECT NULL--"
        ];
    }

    /**
     * Generate test user object
     * @returns {Object} Test user object
     */
    static generateTestUser() {
        return {
            email: this.generateEmail(),
            password: this.generatePassword(),
            firstName: this.generateRandomString(8),
            lastName: this.generateRandomString(10),
            phone: this.generatePhoneNumber(),
            age: this.generateRandomNumber(18, 80)
        };
    }
}

module.exports = DataGenerator;
