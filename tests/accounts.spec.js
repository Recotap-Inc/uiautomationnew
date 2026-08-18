'use strict';

const { test, expect } = require('../fixtures/baseFixtures');
const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { createAccount, ACCOUNT_TEST_DATA, openAccountsList, importAccountsFromCsv } = require('../helpers/accountHelpers');

test.describe('Accounts', () => {
    test('Create account', async ({ authenticatedPage }) => {
        await createAccount(authenticatedPage);
    });

    test('Verify created account appears in list', async ({ authenticatedPage }) => {
        const page = authenticatedPage;
        logger.testStart('Verify created account appears in list');

        await openAccountsList(page);
        await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible({ timeout: config.TIMEOUT });

        await page.getByRole('textbox', { name: 'Search' }).fill(ACCOUNT_TEST_DATA.domain);
        await expect(page.getByRole('link', { name: ACCOUNT_TEST_DATA.domain }).first()).toBeVisible({ timeout: config.TIMEOUT });
        await expect(page.locator('tbody')).toContainText(ACCOUNT_TEST_DATA.domain);

        logger.testEnd('Verify created account appears in list', 'passed');
    });

    test('Import from a file CSV', async ({ authenticatedPage }) => {
        // CSV imports are processed asynchronously, so allow extra time to poll for results.
        test.setTimeout(240000);
        await importAccountsFromCsv(authenticatedPage);
    });

});

