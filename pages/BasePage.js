const { expect } = require('@playwright/test');

/**
 * Base Page Object Model
 * Contains common methods that can be used across all pages
 */
class BasePage {
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigate to a URL
     * @param {string} url - URL to navigate to
     */
    async goto(url) {
        await this.page.goto(url);
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Get current page URL
     * @returns {string} Current URL
     */
    getUrl() {
        return this.page.url();
    }

    /**
     * Get page title
     * @returns {Promise<string>} Page title
     */
    async getTitle() {
        return await this.page.title();
    }

    /**
     * Wait for navigation
     * @param {number} timeout - Timeout in milliseconds
     */
    async waitForNavigation(timeout = 10000) {
        await this.page.waitForLoadState('networkidle', { timeout });
    }

    /**
     * Take a screenshot
     * @param {string} filename - Screenshot filename
     */
    async takeScreenshot(filename) {
        await this.page.screenshot({ path: `reports/screenshots/${filename}.png`, fullPage: true });
    }

    /**
     * Reload the page
     */
    async reload() {
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Go back in browser history
     */
    async goBack() {
        await this.page.goBack();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Go forward in browser history
     */
    async goForward() {
        await this.page.goForward();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Wait for element to be visible
     * @param {import('@playwright/test').Locator} locator - Element locator
     * @param {number} timeout - Timeout in milliseconds
     */
    async waitForElement(locator, timeout = 10000) {
        await locator.waitFor({ state: 'visible', timeout });
    }

    /**
     * Check if element is visible
     * @param {import('@playwright/test').Locator} locator - Element locator
     * @returns {Promise<boolean>} True if visible
     */
    async isElementVisible(locator) {
        return await locator.isVisible().catch(() => false);
    }

    /**
     * Click element
     * @param {import('@playwright/test').Locator} locator - Element locator
     */
    async click(locator) {
        await locator.click();
    }

    /**
     * Fill input field
     * @param {import('@playwright/test').Locator} locator - Element locator
     * @param {string} text - Text to fill
     */
    async fill(locator, text) {
        await locator.fill(text);
    }

    /**
     * Get element text
     * @param {import('@playwright/test').Locator} locator - Element locator
     * @returns {Promise<string>} Element text
     */
    async getText(locator) {
        return await locator.textContent();
    }

    /**
     * Press keyboard key
     * @param {string} key - Key to press
     */
    async pressKey(key) {
        await this.page.keyboard.press(key);
    }

    /**
     * Wait for specified time
     * @param {number} milliseconds - Time to wait
     */
    async wait(milliseconds) {
        await this.page.waitForTimeout(milliseconds);
    }

    /**
     * Verify URL contains text
     * @param {string} text - Text to check in URL
     */
    verifyUrlContains(text) {
        expect(this.page.url()).toContain(text);
    }

    /**
     * Verify URL matches pattern
     * @param {RegExp} pattern - Pattern to match
     */
    verifyUrlMatches(pattern) {
        expect(this.page.url()).toMatch(pattern);
    }

    /**
     * Verify page title
     * @param {string} expectedTitle - Expected title
     */
    async verifyTitle(expectedTitle) {
        const title = await this.getTitle();
        expect(title).toBe(expectedTitle);
    }
}

module.exports = BasePage;
