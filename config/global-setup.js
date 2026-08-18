/**
 * Global Setup
 * Runs once before all tests — logs in and saves auth cookies to playwright/.auth/user.json
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const config = require('./environment');
const { logger } = require('../utils/logger');
const LoginPage = require('../pages/LoginPage');

const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/user.json');

async function globalSetup() {
    logger.info('===== GLOBAL SETUP STARTED =====');
    logger.info(`Environment: ${config.ENV}`);
    logger.info(`Base URL: ${config.BASE_URL}`);

    ensureDirectories();

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    try {
        await loginPage.goto(config.BASE_URL);
        await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);
        await loginPage.verifySuccessfulLogin(config.BASE_URL);

        await context.storageState({ path: AUTH_FILE });
        logger.info('Auth state saved to playwright/.auth/user.json');
    } finally {
        await browser.close();
    }

    logger.info('===== GLOBAL SETUP COMPLETED =====');
}

function ensureDirectories() {
    const dirs = ['reports/screenshots', 'reports/logs', 'playwright/.auth'];
    for (const dir of dirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}

module.exports = globalSetup;
