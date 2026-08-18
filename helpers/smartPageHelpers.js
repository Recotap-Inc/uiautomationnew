'use strict';

const { expect } = require('@playwright/test');
const config = require('../config/environment');
const Helpers = require('../utils/helpers');
const { logger } = require('../utils/logger');
const { SEGMENT_TEST_DATA } = require('./segmentHelpers');
const { ACCOUNT_TEST_DATA } = require('./accountHelpers');

const getAccessibleButton = async (page, text) => {
    const button = page.getByRole('button', { name: new RegExp(`\\b${text}\\b`, 'i') }).first();
    if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        return button;
    }
    return page.locator(`button:has-text("${text}")`).first();
};

const clickAccessibleButton = async (page, text) => {
    const button = await getAccessibleButton(page, text);
    await button.waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await button.click();
};

const SMART_PAGE_TEST_DATA = {
    name: `smartpage-${Helpers.generateUniqueId()}`,
    url: 'https://divya-omega-landing-3-html.onrender.com',
    segmentName: SEGMENT_TEST_DATA.name
};

const openSmartPagesList = async (page) => {
    await page.getByRole('link', { name: 'Smart Pages' }).first().click();
    await page.locator('#kt_app_sidebar_primary_navbar').getByText('Smart Pages').click();
    await expect(page.getByRole('button', { name: 'Create Page' })).toBeVisible({ timeout: config.TIMEOUT });
};

const createSmartPage = async (page, testData = SMART_PAGE_TEST_DATA) => {
    logger.testStart('Create smart page and verify in list');

    await openSmartPagesList(page);

    // Search by name prefix so paginated/archived rows with this URL appear in the DOM.
    // The search box is name-only so we can't search by URL directly.
    const searchBox = page.getByRole('textbox', { name: 'Search' });
    await searchBox.fill('smartpage');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const urlRows = page.locator('tbody tr').filter({ hasText: testData.url });
    let urlRowCount = await urlRows.count();
    logger.info(`Found ${urlRowCount} smart page(s) with URL ${testData.url}`);

    while (urlRowCount > 0) {
        const row = urlRows.first();
        // Try status button (active/inactive/draft) → archive
        const statusBtn = row.locator('button').filter({ hasText: /active|inactive|draft/i }).first();
        if (await statusBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await statusBtn.click();
            const archiveOpt = page.locator('[role="option"], [role="menuitem"], .dropdown-item, .ng-option').filter({ hasText: /archive/i }).first();
            if (await archiveOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
                await archiveOpt.click();
            } else {
                await page.getByText('Archive', { exact: false }).first().click().catch(() => {});
            }
        } else {
            // Fall back to kebab/actions button in the row
            await row.getByRole('button').last().click({ timeout: 3000 }).catch(() => {});
            const deleteOpt = page.locator('[role="menuitem"], .dropdown-item, li').filter({ hasText: /delete/i }).first();
            const archiveOpt = page.locator('[role="menuitem"], .dropdown-item, li').filter({ hasText: /archive/i }).first();
            if (await deleteOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
                await deleteOpt.click();
            } else if (await archiveOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
                await archiveOpt.click();
            } else {
                await page.keyboard.press('Escape');
                break;
            }
        }
        // SweetAlert2 confirm button
        const swalConfirm = page.locator('.swal2-confirm');
        if (await swalConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
            await swalConfirm.click();
        } else {
            await page.getByRole('button', { name: /confirm|yes|ok/i }).click().catch(() => {});
        }
        await page.waitForLoadState('networkidle', { timeout: config.TIMEOUT }).catch(() => {});
        await page.waitForTimeout(500);
        urlRowCount = await urlRows.count();
    }

    await searchBox.clear();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'Create Page' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('button', { name: 'Create Page' }).click();

    await page.getByRole('textbox', { name: 'Enter Smart Page name' }).fill(testData.name);
    await page.getByRole('textbox', { name: 'Enter URL' }).fill(testData.url);

    await page.getByText('From Segments').click();
    await page.getByRole('combobox').getByRole('textbox').fill(testData.segmentName);
    const segmentOption = page.locator('.ng-option, [role="option"]').filter({ hasText: testData.segmentName }).first();
    await segmentOption.waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await segmentOption.click();
    // Close the dropdown so the form recognises the selection
    await page.locator('body .ng-dropdown-panel').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});

    await clickNextStep(page);
    await clickNextStep(page);

    // Step 3 shows "Kickstart Personalization" — click Personalise to open the designer
    await clickAccessibleButton(page, 'Personalise');
    await page.waitForLoadState('networkidle', { timeout: config.TIMEOUT });

    // Open the account selector then close it via a heading click — this activates
    // element-selection mode so that 'Select personalization' appears on clicks.
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('combobox').click();
    await page.getByRole('heading').first().click();

    // Click the paragraph and assign Account Name personalization
    await page.locator('div').filter({ hasText: 'Redesigned, how you build' }).getByRole('paragraph').click();
    await expect(page.getByRole('img', { name: 'Select personalization' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('img', { name: 'Select personalization' }).click();
    await page.getByText('Account Name').click();
    await page.getByRole('img', { name: 'Save the Rule' }).click();
    // Rule saved successfully → designer returns to the idle "select an element" state
    await expect(page.getByText('Select an element to start personalisation')).toBeVisible({ timeout: config.TIMEOUT });

    // Close the designer to return to the wizard
    await page.locator('.rtp-close-button-right > img').click();

    // On the final step (Personalised Rules), publish the changes so the smart page becomes active.
    await page.getByRole('button', { name: 'Publish Changes Publish', exact: true }).click();
    // Wait for publishing to complete before navigating away — otherwise the next test
    // hits a "currently being published" modal when trying to edit.
    await expect(page.getByLabel('Changes published')).toContainText('Changes published successfully!', { timeout: config.TIMEOUT });

    // Navigate back to the list and verify the created page appears
    await openSmartPagesList(page);
    await page.getByRole('textbox', { name: 'Search' }).fill(testData.name);
    const createdRow = page.locator('tbody tr').filter({ hasText: testData.name });
    await expect(createdRow.first()).toBeVisible({ timeout: config.TIMEOUT });
    await expect(createdRow.first()).toContainText(testData.name);
    await expect(createdRow.first()).toContainText('active', { timeout: config.TIMEOUT });

    logger.testEnd('Create smart page and verify in list', 'passed');
};

// Wizard navigation triggers a background save ("Please wait..." state) when moving between steps.
// These helpers ensure the wizard is fully settled before the next click — otherwise back-to-back
// navigations can stall the form in a stuck "Please wait..." state.
const waitForWizardReady = async (page) => {
    await page.getByRole('button', { name: 'Please wait...' }).waitFor({ state: 'hidden', timeout: config.TIMEOUT }).catch(() => {});
};

const clickNextStep = async (page) => {
    await waitForWizardReady(page);
    await clickAccessibleButton(page, 'Next');
};

const clickBackStep = async (page) => {
    await waitForWizardReady(page);
    await clickAccessibleButton(page, 'Back');
};

const selectAccountForPreview = async (page, accountData) => {
    const previewButton = page.getByRole('button', { name: /preview/i }).first();
    if (await previewButton.isVisible({ timeout: 3000 }).catch(() => false) && await previewButton.isDisabled()) {
        const accountCombo = page.getByRole('combobox').first();
        if (await accountCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
            await accountCombo.click();
            const input = accountCombo.locator('input[type="text"]');
            if (await input.count() > 0) {
                await input.fill(accountData.accountName || accountData.domain, { timeout: config.TIMEOUT });
            }
            const accountOption = page.locator('[role="option"], .ng-option, li').filter({ hasText: accountData.accountName || accountData.domain }).first();
            if (await accountOption.isVisible({ timeout: config.TIMEOUT }).catch(() => false)) {
                await accountOption.click();
            } else {
                const fallbackOption = page.locator('[role="option"], .ng-option, li').first();
                if (await fallbackOption.isVisible({ timeout: config.TIMEOUT }).catch(() => false)) {
                    await fallbackOption.click();
                }
            }
            await page.waitForLoadState('networkidle', { timeout: config.TIMEOUT }).catch(() => {});
            await page.waitForTimeout(500);
        }
    }
};

const editAndPublishSmartPage = async (page, pageName, accountData = ACCOUNT_TEST_DATA) => {
    logger.testStart('Edit and publish smart page');

    await openSmartPagesList(page);

    await page.getByRole('textbox', { name: 'Search' }).fill(pageName);
    await expect(page.locator('tbody')).toContainText(pageName, { timeout: config.TIMEOUT });

    // Entering the editor right after creation can be blocked by a "changes are currently
    // being published" dialog. Publishing can take longer than a single wait, so retry —
    // dismissing the dialog and waiting — until the editor actually opens (its wizard
    // "Next" button becomes available).
    const okayBtn = page.getByRole('button', { name: 'Okay' });
    const nextBtn = page.getByRole('button', { name: /\bNext\b/i }).first();
    let editorOpened = false;
    for (let attempt = 0; attempt < 12 && !editorOpened; attempt++) {
        page.reload();
        await page.waitForLoadState('networkidle', { timeout: config.TIMEOUT }).catch(() => {});
        await page.waitForTimeout(1000);
        // Trigger the edit from the list. Guarded because a lingering dialog can cover
        // the list — in that case we fall through to dismiss it and re-check below.
        try {
            await page.getByRole('cell', { name: `${pageName} 1:1 https://` }).getByRole('button').first().click({ timeout: 10000 });
            await page.getByRole('button', { name: 'Edit Edit' }).click({ timeout: 10000 });
        } catch (e) { /* not on the list right now — handled below */ }
        await page.waitForLoadState('networkidle', { timeout: config.TIMEOUT }).catch(() => {});

        // The "currently being published" dialog can appear over the editor; dismiss it.
        if (await okayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await okayBtn.click().catch(() => {});
        }

        // The editor is open once its wizard "Next" button is available.
        editorOpened = await nextBtn.isVisible({ timeout: 8000 }).catch(() => false);
        if (!editorOpened) {
            await page.waitForTimeout(15000); // still publishing — let it settle, then retry
        }
    }
    expect(editorOpened, 'Smart page editor did not open — still publishing after retries').toBe(true);

    await clickNextStep(page);
    await expect(page.getByText('Edit Smart Page')).toBeVisible({ timeout: config.TIMEOUT });

    await clickBackStep(page);
    await clickNextStep(page);
    await expect(page.getByLabel('Success', { exact: true })).toBeVisible({ timeout: config.TIMEOUT });

    await clickBackStep(page);
    await clickNextStep(page);
    await expect(page.getByRole('alert', { name: 'Smart page updated' }).first()).toBeVisible({ timeout: config.TIMEOUT });

    await clickNextStep(page);
    // Step 2 → Step 3 success indicator: the "Data step completed successfully!" message.
    await expect(page.getByLabel('Data step completed')).toContainText('Data step completed successfully!', { timeout: config.TIMEOUT });
    // On the Personalised Rules step, a rule already exists from the create flow,
    // so the action is "Edit Personalise" rather than the first-time "Personalise".
    const editPersonaliseBtn = page.getByRole('button', { name: 'pencil Edit Personalise' });
    await expect(editPersonaliseBtn).toBeVisible({ timeout: config.TIMEOUT });
    await editPersonaliseBtn.click();
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('combobox').click();
    await page.getByRole('heading').first().click();

   
    await page.getByTitle('Select personalization properties').click();
    await page.getByText('Account Domain').click();
    await page.getByTitle('Select personalization properties').click();
    await page.getByText('Account Name').click();
    await page.getByTitle('Save the Rule').click();

  /*   await page.getByRole('img', { name: 'Image with Border' }).click();
    await page.getByRole('img', { name: 'Select personalization' }).click();
    await page.getByText('Account Logo').click();
    await page.getByRole('img', { name: 'Save the Rule' }).click();
    await expect(page.getByRole('img', { name: 'Image with Border' })).toBeVisible({ timeout: config.TIMEOUT }); */

    await selectAccountForPreview(page, accountData);
    const previewButton = page.getByRole('button', { name: /preview/i }).first();
    await expect(previewButton).toBeVisible({ timeout: config.TIMEOUT });
    await expect(previewButton).toBeEnabled({ timeout: config.TIMEOUT });
    await previewButton.click();
    await expect(page.locator('body')).toContainText(accountData.accountName, { timeout: config.TIMEOUT });
    await expect(page.getByRole('img', { name: 'Image with Border' })).toBeVisible({ timeout: config.TIMEOUT });
    await page.getByRole('button', { name: /close preview/i }).click();

    await page.locator('.rtp-close-button-right > img').click();
    await expect(page.getByRole('button', { name: 'Publish Changes Publish Changes' })).toBeVisible({ timeout: config.TIMEOUT });

    await page.getByRole('button', { name: 'Publish Changes Publish Changes', exact: true }).click();
    await expect(page.getByLabel('Changes published')).toContainText('Changes published successfully!', { timeout: config.TIMEOUT });

    await page.getByRole('textbox', { name: 'Search' }).fill(pageName);
    const smartPageRow = page.locator('tbody tr').filter({ hasText: pageName });
    await expect(smartPageRow).toHaveCount(1, { timeout: config.TIMEOUT });
    await expect(smartPageRow.first()).toContainText('active');

    logger.testEnd('Edit and publish smart page', 'passed');
    
};

module.exports = { createSmartPage, editAndPublishSmartPage, SMART_PAGE_TEST_DATA, openSmartPagesList };
