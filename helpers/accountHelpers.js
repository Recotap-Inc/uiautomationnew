'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { expect } = require('@playwright/test');
const config = require('../config/environment');
const Helpers = require('../utils/helpers');
const { logger } = require('../utils/logger');

const _uid = Helpers.generateUniqueId();
const ACCOUNT_TEST_DATA = {
    domain: `google-${_uid}.com`,
    accountName: `google-${_uid}`,
    shortName: `ggl-${_uid}`,
    industry: 'Internet News',
    revenueRange: '$5M - $10M',
    employeeRange: '10K - 50K',
    hqLocation: 'United Kingdom',
    tagValue: `autotag-${_uid}`
};

const isDropdownValueSelected = async (selectLocator, expectedText) => {
    if ((await selectLocator.count()) === 0) return false;
    const valueContainer = selectLocator.locator('.ng-value-container').first();
    if ((await valueContainer.count()) === 0) return false;
    const valueText = ((await valueContainer.textContent().catch(() => '')) || '')
        .replace(/\s+/g, ' ').trim().toLowerCase();
    return valueText.includes(expectedText.toLowerCase());
};

const selectDropdownWithRetry = async (page, selectLocator, searchText, optionName, expectedText = optionName, fieldName = expectedText) => {
    if ((await selectLocator.count()) === 0) throw new Error(`${fieldName} dropdown not found`);

    await Helpers.retryWithBackoff(async () => {
        const input = selectLocator.locator('input[type="text"]').first();
        await selectLocator.click({ timeout: config.TIMEOUT }).catch(() => {});
        if ((await input.count()) > 0 && (await input.isVisible().catch(() => false))) {
            await input.click({ timeout: config.TIMEOUT }).catch(() => {});
            await input.fill(searchText, { timeout: config.TIMEOUT }).catch(() => {});
        }
        const option = page.getByRole('option', { name: optionName, exact: true }).first();
        if ((await option.count()) > 0 && (await option.isVisible().catch(() => false))) {
            await option.click({ timeout: config.TIMEOUT }).catch(() => {});
        } else {
            const optionByClass = page.locator('.ng-dropdown-panel .ng-option').filter({ hasText: optionName }).first();
            if ((await optionByClass.count()) > 0 && (await optionByClass.isVisible().catch(() => false))) {
                await optionByClass.click({ timeout: config.TIMEOUT }).catch(() => {});
            } else if ((await input.count()) > 0) {
                await input.press('Enter').catch(() => {});
            }
        }
        const selected = await isDropdownValueSelected(selectLocator, expectedText);
        if (!selected) {
            await page.keyboard.press('Escape').catch(() => {});
            throw new Error(`${fieldName} selection not applied yet`);
        }
    }, config.RETRY_ATTEMPTS, 500);
};

const openAccountsList = async (page) => {
    await expect(page.getByText('Audience')).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByText('Audience').click();
    await expect(page.getByRole('link', { name: 'building Accounts Upload' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('link', { name: 'building Accounts Upload' }).click();
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible({ timeout: config.TIMEOUT });
};

const createAccount = async (page, testData = ACCOUNT_TEST_DATA) => {
    logger.testStart('Create account');

    await openAccountsList(page);

    await expect(page.getByRole('button', { name: 'Add Accounts' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('button', { name: 'Add Accounts' }).click();
    await page.locator('a').filter({ hasText: 'Create Manually' }).click();

    await page.getByRole('textbox', { name: 'Enter domain' }).fill(testData.domain);
    await page.getByRole('textbox', { name: 'Enter Account name' }).fill(testData.accountName);
    await page.getByRole('textbox', { name: 'Enter Short name' }).fill(testData.shortName);

    const industrySelect = page.locator('ng-select[placeholder="Select Industry"]:visible').first();
    await selectDropdownWithRetry(page, industrySelect, testData.industry, testData.industry, testData.industry, 'Industry');

    const revenueSelect = page.locator('ng-select[placeholder="Select Revenue Range"]:visible').first();
    await selectDropdownWithRetry(page, revenueSelect, testData.revenueRange, testData.revenueRange, testData.revenueRange, 'Revenue');

    const employeeSizeSelect = page.locator('ng-select[placeholder="Select Employee Range"]:visible').first();
    await selectDropdownWithRetry(page, employeeSizeSelect, testData.employeeRange, testData.employeeRange, testData.employeeRange, 'Employee Size');

    const hqSelect = page.locator('ng-select[placeholder="Select HQ Location"]:visible').first();
    await selectDropdownWithRetry(page, hqSelect, testData.hqLocation.toLowerCase(), testData.hqLocation, testData.hqLocation, 'HQ Location');

    
    await page.getByRole('link', { name: 'Search LinkedIn Company' }).click();
    await page.locator('.ng-select__customStyles.bg-gray-50 > .ng-select-container > .ng-value-container > .ng-input > input').click();
    await page.locator('.ng-select__customStyles.bg-gray-50 > .ng-select-container > .ng-value-container > .ng-input > input').fill('google');
    await page.getByRole('option', { name: 'Google', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Enter LinkedIn URL' })).toBeVisible();
       //await page.getByRole('textbox', { name: 'Enter LinkedIn URL' }).fill('https://www.linkedin.com/company/google/');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByLabel('Success')).toBeVisible({ timeout: config.TIMEOUT });

    const urlBeforeReload = page.url();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(urlBeforeReload, { timeout: config.TIMEOUT });
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible({ timeout: config.TIMEOUT });

    await page.getByRole('textbox', { name: 'Search' }).fill(testData.domain);
    await page.waitForLoadState('networkidle', { timeout: config.TIMEOUT }).catch(() => {});

    const accountDomainCell = page.locator('span').filter({ hasText: testData.domain }).last();
    await expect(accountDomainCell).toHaveText(testData.domain, { timeout: config.TIMEOUT });

    await accountDomainCell.click();
    await expect(page.getByTitle(testData.accountName).first()).toBeVisible({ timeout: config.TIMEOUT });
    await page.locator(':text-is("Add")').click();
    await page.getByRole('textbox', { name: 'Add tag here...' }).fill(testData.tagValue);
    await page.keyboard.press('Enter');
    await page.getByRole('alert', { name: /Tag created successfully/i }).first().waitFor({ state: 'visible', timeout: config.TIMEOUT });

    logger.testEnd('Create account', 'passed');
};

const importAccountsFromCsv = async (page) => {
    logger.testStart('Import accounts from a CSV file');

    const uploadData = [
        { domain: `import-${Helpers.generateUniqueId()}.com`, accountName: `Import Account ${Helpers.generateUniqueId()}` },
        { domain: `import-${Helpers.generateUniqueId()}.com`, accountName: `Import Account ${Helpers.generateUniqueId()}` }
    ];
    const csvRows = ['Account Domain,Account Name',
        `${uploadData[0].domain},${uploadData[0].accountName}`,
        `${uploadData[1].domain},${uploadData[1].accountName}`
    ];
    const csvPath = path.join(os.tmpdir(), `accounts-import-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvRows.join('\n'));

    // Pick an ng-select option by visible text and assert the value was applied.
    const selectNgOption = async (selectLocator, optionText) => {
        await expect(selectLocator).toBeVisible({ timeout: config.TIMEOUT });
        await selectLocator.click();
        const optionMatcher = new RegExp(optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        await page
            .locator('.ng-dropdown-panel .ng-option')
            .filter({ hasText: optionMatcher })
            .first()
            .click({ timeout: config.TIMEOUT });
        await expect(selectLocator.locator('.ng-value-container')).toContainText(optionMatcher, { timeout: config.TIMEOUT });
    };

    // --- Open the import wizard ---
    await openAccountsList(page);
    await expect(page.getByRole('button', { name: /Add Accounts/i })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('button', { name: /Add Accounts/i }).click();
    await page.getByRole('button', { name: /Import from a File/i }).click();
    await expect(page.getByRole('heading', { name: 'Import Accounts' })).toBeVisible({ timeout: config.TIMEOUT });

    // --- Step 1: Upload ---
    // The file input is visually hidden (d-none), so target it by id.
    const fileInput = page.locator('#fileInput');
    await expect(fileInput).toHaveCount(1, { timeout: config.TIMEOUT });
    await fileInput.setInputFiles(csvPath);
    // The uploaded file name surfaces on screen once accepted.
    await expect(page.getByRole('heading', { name: path.basename(csvPath) })).toBeVisible({ timeout: config.TIMEOUT });

    // Choose how to import.
    await selectNgOption(page.locator('ng-select').first(), 'Create And Update Accounts');

    // Advance Upload -> Map.
    await page.getByRole('button', { name: /Continue/i }).click();

    // --- Step 2: Map ---
    // Each CSV column defaults to "Don't import this column"; map every column
    // to the matching Recotap property so the required properties are satisfied.
    await expect(page.getByRole('heading', { name: /Review the Mapping/i })).toBeVisible({ timeout: config.TIMEOUT });

    const mapColumn = async (columnName, propertyName = columnName) => {
        // Identify the row by its "Column Name" cell — matching whole-row text is
        // ambiguous because another row's open dropdown lists the same property names.
        const row = page.getByRole('row')
            .filter({ has: page.getByRole('cell', { name: columnName, exact: true }) })
            .first();

        // Open the custom dropdown (defaults to "Don't import this column").
        await row.getByRole('button', { name: /Don't import this column/i }).click();
        // Options render as ".menu-link" entries (padded with whitespace) in the open panel.
        await row.locator('.menu-link', { hasText: propertyName }).first().click();
        // The toggle's label now reflects the mapped property.
        await expect(row.getByRole('button', { name: propertyName }).first()).toBeVisible({ timeout: config.TIMEOUT });
    };

    await mapColumn('Account Domain');
    await mapColumn('Account Name');

    // With required properties mapped, Continue becomes enabled.
    const mapContinue = page.getByRole('button', { name: /Continue/i });
    await expect(mapContinue).toBeEnabled({ timeout: config.TIMEOUT });
    await mapContinue.click();

    // --- Step 3: Segments ---
    const segmentName = `import-segment-${Helpers.generateUniqueId()}`;
    const segmentNameField = page.getByRole('textbox', { name: /Segment Name/i })
        .or(page.getByPlaceholder(/Segment Name/i))
        .first();
    await expect(segmentNameField).toBeVisible({ timeout: config.TIMEOUT });
    await segmentNameField.fill(segmentName);
    await page.getByRole('button', { name: /Finish Import/i }).click();

    // --- Verify the import was submitted ---
    // Finishing lands on the Imports history page; wait for it to settle so the
    // subsequent navigation isn't interrupted by this redirect.
    await expect(page.getByRole('heading', { name: 'Imports' })).toBeVisible({ timeout: config.TIMEOUT });
    const fileName = path.basename(csvPath);
    await page.getByRole('textbox', { name: /Search by file name/i }).fill(fileName);
    await expect(page.getByRole('row').filter({ hasText: fileName }).first()).toBeVisible({ timeout: config.TIMEOUT });

    // --- Verify imported accounts appear in the Accounts list (async processing) ---
    await openAccountsList(page);
    await expect(page.getByRole('textbox', { name: 'Search' }).first()).toBeVisible({ timeout: config.TIMEOUT });

    for (const { domain } of uploadData) {
        // Re-search on each attempt so newly-processed accounts get picked up.
        await expect(async () => {
            await page.getByRole('textbox', { name: 'Search' }).first().fill(domain);
            await expect(page.getByRole('link', { name: domain }).first()).toBeVisible({ timeout: 5000 });
        }).toPass({ timeout: 120000, intervals: [5000, 5000, 10000] });
    }

    logger.testEnd('Import accounts from a CSV file', 'passed');

    return uploadData;
};

module.exports = { createAccount, ACCOUNT_TEST_DATA, openAccountsList, importAccountsFromCsv };
