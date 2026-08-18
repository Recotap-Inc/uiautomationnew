'use strict';

const { expect } = require('@playwright/test');
const config = require('../config/environment');
const Helpers = require('../utils/helpers');
const { logger } = require('../utils/logger');
const { ACCOUNT_TEST_DATA } = require('./accountHelpers');

const SEGMENT_TEST_DATA = {
    name: `autoseg-${Helpers.generateUniqueId()}`
};

const openSegmentsList = async (page) => {
    await expect(page.getByText('Audience')).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByText('Audience').click();
    await expect(page.getByRole('link', { name: 'people Segments Group' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('link', { name: 'people Segments Group' }).click();
};

const createSegmentAndVerifyInList = async (page, segmentData = SEGMENT_TEST_DATA, accountData = ACCOUNT_TEST_DATA) => {
    logger.testStart('Create segment and verify in list');

    await openSegmentsList(page);

    await page.getByRole('button', { name: ' Create Segment' }).click();
    await page.getByRole('textbox', { name: 'Segment Name' }).fill(segmentData.name);
    await page.getByText('Setup Filter').click();
    await page.getByRole('button', { name: 'Nextcreate' }).click();

    await page.locator('.ng-arrow-wrapper').first().click();
    await page.getByText('Account Attributes').click();
    await page.locator('app-field-list-fieldtype').getByRole('combobox').click();
    await page.getByText('Tags').click();
    await page.locator('app-text-fieldtype').getByRole('combobox').click();
    await page.getByRole('option', { name: 'Is Equal To', exact: true }).click();
    const valueSelect = page.locator('ng-select').filter({ hasText: 'Search Value' });
    await valueSelect.click();
    const searchInput = valueSelect.getByRole('textbox');
    await searchInput.clear();
    await searchInput.pressSequentially(accountData.tagValue, { delay: 50 });
    const tagOption = page.locator('.ng-dropdown-panel .ng-option', { hasText: accountData.tagValue }).first();
    await tagOption.waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await tagOption.click();

    await page.getByRole('button', { name: 'createActivate' }).click();
    await expect(page.locator('tbody')).toContainText(accountData.domain, { timeout: config.TIMEOUT });

    await page.getByRole('link', { name: 'Back navigation' }).click();
    await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('textbox', { name: 'Search' }).fill(segmentData.name);
    await expect(page.getByText(segmentData.name)).toBeVisible({ timeout: config.TIMEOUT });
    await expect(page.locator('tbody')).toContainText(segmentData.name);

    logger.testEnd('Create segment and verify in list', 'passed');
};

module.exports = { createSegmentAndVerifyInList, SEGMENT_TEST_DATA, openSegmentsList };
