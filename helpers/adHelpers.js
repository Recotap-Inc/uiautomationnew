'use strict';

const { expect } = require('@playwright/test');
const config = require('../config/environment');
const Helpers = require('../utils/helpers');
const { logger } = require('../utils/logger');

const AD_TEST_DATA = {
    name: `testad-${Helpers.generateUniqueId()}`,
    url: 'https://www.recotap1.com'
};

const openAdsList = async (page) => {
    const adsUrl = new URL('/content-hub/ads', config.BASE_URL).href;
    await page.goto(adsUrl);
    await expect(page.getByRole('button', { name: / Create New Ad/ })).toBeVisible({ timeout: config.TIMEOUT });
};

const createAd = async (page, testData = AD_TEST_DATA) => {
    logger.testStart('Create ad and verify in list');

    await openAdsList(page);

    await expect(page.getByRole('button', { name: ' Create New Ad' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('button', { name: ' Create New Ad' }).click();

    await page.getByRole('textbox', { name: 'Enter Ad name' }).fill(testData.name);
    await page.getByText('Display', { exact: true }).click();
    await page.getByRole('radio', { name: 'Other URL' }).check();
    await page.getByRole('textbox', { name: 'Enter URL' }).fill(testData.url);
    await page.getByRole('button', { name: 'Nextcreate' }).click();

    await page.getByRole('button', { name: 'Build using Template Build' }).waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await page.getByRole('button', { name: 'Build using Template Build' }).click();
    await page.getByRole('link', { name: /Recotap Templates/ }).click();
    await page.locator('img[alt="Template preview"]').first().waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await page.locator('img[alt="Template preview"]').first().click();
    await page.locator('button').filter({ hasText: 'Next' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await page.locator("//div[@data-placeholder='Ad headline']").first().click();
    await page.locator("//div[@data-placeholder='Ad headline']").first().fill('test ad headline');

    await page.locator("//div[@data-placeholder='Ad copy text']").first().click();
    await page.locator("//div[@data-placeholder='Ad copy text']").first().fill('test ad copy text');

    await page.getByRole('combobox').getByRole('textbox').click();
    await page.getByRole('option', { name: 'Download' }).click();

    await page.getByRole('button', { name: 'Activate Activate' }).click();
    await expect(page.getByLabel('Success', { exact: true })).toBeVisible({ timeout: config.TIMEOUT });

    await page.getByRole('textbox', { name: 'Search' }).fill(testData.name);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1, { timeout: config.TIMEOUT });
    await expect(rows.first()).toContainText(testData.name);
    await expect(rows.first()).toContainText('active');

    logger.testEnd('Create ad and verify in list', 'passed');
};

module.exports = { createAd, AD_TEST_DATA, openAdsList };
