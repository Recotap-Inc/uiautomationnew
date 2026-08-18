const path = require('path');
const fs = require('fs');
const base = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const { logger } = require('../utils/logger');

const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/user.json');

const takeFailureScreenshot = async (page, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
        const screenshotPath = `reports/screenshots/failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        logger.error(`Test failed: ${testInfo.title}. Screenshot saved to ${screenshotPath}`);
    }
};

const test = base.test.extend({
    // Inject saved auth state into Playwright's built-in context fixture.
    // This means every test context (page/authenticatedPage) shares the same
    // single browser context — no second window is opened.
    storageState: async ({}, use) => {
        await use(fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined);
    },

    // Launches a fully isolated browser (not the worker-shared `browser` fixture)
    // so there is zero session bleed from authenticated tests running in the same worker.
    loginPage: async ({}, use, testInfo) => {
        const { chromium } = require('@playwright/test');
        const headless = process.env.HEADLESS !== 'true';
        const browser = await chromium.launch({ headless });
        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();
        const loginPage = new LoginPage(page);
        await use(loginPage);
        await takeFailureScreenshot(page, testInfo);
        await browser.close();
    },

    // Uses Playwright's built-in `page` (same window as all other fixtures).
    // Previously used `{ browser }` + browser.newContext(), which opened a
    // second browser window. Now the single Playwright-managed context is reused.
    authenticatedPage: async ({ page }, use, testInfo) => {
        const config = require('../config/environment');
        logger.info(`Setting up authenticated session for test: ${testInfo.title}`);

        const rootUrl = config.BASE_URL.replace(/\/auth\/.*$/, '/');
        await page.goto(rootUrl);
        await page.waitForLoadState('networkidle');

        if (page.url().includes('/auth/')) {
            logger.info('Auth state missing or expired — performing fresh login');
            const loginPage = new LoginPage(page);
            await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);
            await page.waitForURL((url) => !url.href.includes('/auth/'), { timeout: 30000 });
            await page.context().storageState({ path: AUTH_FILE });
        }

        await use(page);
        await takeFailureScreenshot(page, testInfo);
    },

    testData: async ({}, use) => {
        const testData = {
            validEmail: 'divya@recotap.com',
            validPassword: 'Test@123',
            invalidEmail: 'invalid@recotap.com',
            invalidPassword: 'WrongPass123',
            invalidEmails: ['notanemail', 'test@', '@domain.com', 'test space@domain.com'],
            xssPayload: '<script>alert("XSS")</script>',
            sqlPayload: "' OR '1'='1"
        };
        await use(testData);
    },

    // No `{ page }` dependency — avoids creating an extra window for tests
    // that use authenticatedPage. Screenshots are handled in fixture teardowns above.
    autoScreenshot: [async ({}, use) => {
        await use();
    }, { auto: true }]
});

module.exports = { test, expect: base.expect };
