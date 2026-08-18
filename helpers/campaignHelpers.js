'use strict';

const { expect } = require('@playwright/test');
const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { SEGMENT_TEST_DATA } = require('./segmentHelpers');
const { AD_TEST_DATA } = require('./adHelpers');

// Opens an ng-select dropdown and returns the panel. Stops at the first method
// that actually opens the panel — avoids toggle-close-reopen from redundant clicks.
const openNgSelect = async (page, selectLocator) => {
    const panel = page.locator('body .ng-dropdown-panel').first();
    // Only treat the panel as already-open if it is stable (not mid-close animation).
    // A fresh 50ms check avoids mistakenly returning a panel that is closing.
    const alreadyOpen = await panel.isVisible().catch(() => false)
        && await panel.isVisible({ timeout: 50 }).catch(() => false);
    if (alreadyOpen) return panel;

    const textbox = selectLocator.locator('input[type="text"], [role="textbox"]').first();
    if (await textbox.count() > 0) {
        await textbox.evaluate(el => el.click()).catch(() => {});
        if (await panel.isVisible({ timeout: 500 }).catch(() => false)) return panel;

        const box = await textbox.boundingBox().catch(() => null);
        if (box) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            if (await panel.isVisible({ timeout: 500 }).catch(() => false)) return panel;
        }
    }

    const arrow = selectLocator.locator('.ng-arrow-wrapper, .ng-select-arrow').first();
    if (await arrow.count() > 0) {
        await arrow.click({ timeout: 3000 }).catch(() => {});
        if (await panel.isVisible({ timeout: 500 }).catch(() => false)) return panel;
    }

    await selectLocator.click({ timeout: 3000 }).catch(() => {});
    await panel.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    return panel;
};

const openCampaignsList = async (page) => {
    const campaignsUrl = new URL('/engage/advertising/campaigns', config.BASE_URL).href;
    await page.goto(campaignsUrl);
    await expect(page.getByRole('heading', { name: 'Campaigns', level: 1 })).toBeVisible({ timeout: config.TIMEOUT });
};

const createCampaign = async (page, segmentName = SEGMENT_TEST_DATA.name, adName = AD_TEST_DATA.name) => {
    logger.testStart('should create a new campaign successfully');

    await openCampaignsList(page);

    const createButton = page.getByRole('button', { name: 'Create Campaign' });
    await createButton.waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await createButton.first().click();

    const nameBox = page.getByRole('textbox', { name: 'Enter campaign name' });
    await nameBox.waitFor({ state: 'visible', timeout: config.TIMEOUT });
    const campaignName = `automate1 ${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await nameBox.fill(campaignName);

    const nextBtn = page.getByRole('button', { name: 'Next next' });
    if ((await nextBtn.count()) > 0) {
        await nextBtn.first().click();
    } else {
        const altNext = page.getByRole('button', { name: 'Next' });
        if ((await altNext.count()) > 0) await altNext.first().click();
    }

    await expect(page.getByRole('heading', { name: 'Configure Campaign' })).toBeVisible({ timeout: config.TIMEOUT });

    const runIndef = page.getByRole('checkbox', { name: 'Run Campaign Indefinitely' });
    const isChecked = await runIndef.isChecked().catch(() => false);
    if (!isChecked) {
        try {
            await runIndef.check({ timeout: config.TIMEOUT });
        } catch (e) {
            await runIndef.evaluate((el) => {
                el.checked = true;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }).catch(() => {});
        }
    }

    await page.locator('app-campaign-segment').getByRole('textbox').click();
    await page.locator('app-campaign-segment').getByRole('textbox').fill(segmentName);
    await page.getByRole('option', { name: segmentName }).click();
    // Wait for the segment panel to fully close before touching the dept dropdown
    await page.locator('body .ng-dropdown-panel').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const deptSelectByPlaceholder = page.locator('ng-select').filter({ hasText: 'Select Department' }).first();
    if (await deptSelectByPlaceholder.count() > 0) {
        await deptSelectByPlaceholder.scrollIntoViewIfNeeded().catch(() => {});
        // Capture a stable index-based reference — the placeholder-based locator stops
        // matching once the first option is selected and the placeholder disappears.
        const deptIdx = await deptSelectByPlaceholder.evaluate(el =>
            Array.from(document.querySelectorAll('ng-select')).indexOf(el)
        );
        const deptSelect = page.locator('ng-select').nth(deptIdx);

        let panel = await openNgSelect(page, deptSelect);
        await panel.waitFor({ state: 'visible', timeout: config.TIMEOUT });

        // Wait for either selectable options or "No items found" to settle
        const hasOptions = await panel.locator('.ng-option:not(.ng-option-disabled)').first()
            .waitFor({ state: 'visible', timeout: 10000 })
            .then(() => true)
            .catch(() => false);

        if (!hasOptions) {
            // Department has no options for this account — close and skip
            logger.info('Department dropdown returned no options — skipping department selection');
            await page.keyboard.press('Escape');
        } else {
            // Snapshot option labels while panel is open
            const deptNames = await panel.locator('.ng-option:not(.ng-option-disabled)')
                .allTextContents().catch(() => []);

            for (const raw of deptNames) {
                const name = raw.trim();
                if (!name) continue;
                const opt = panel.locator('.ng-option:not(.ng-option-disabled)')
                    .filter({ hasText: name }).first();
                if ((await opt.count()) === 0) {
                    panel = await openNgSelect(page, deptSelect);
                }
                if ((await opt.count()) > 0) {
                    try {
                        await opt.click();
                        await page.waitForTimeout(50);
                        // If panel closed it's a single-select — stop after first selection
                        if (!(await panel.isVisible().catch(() => false))) break;
                    } catch (e) {}
                }
            }
            if ((await page.locator('body .ng-dropdown-panel').first().isVisible().catch(() => false))) {
                await page.keyboard.press('Escape');
            }

            // Verify at least one department value was actually selected
            await expect(deptSelect.locator('.ng-value-label, .ng-value-container .ng-value').first())
                .toBeVisible({ timeout: config.TIMEOUT });
        }
    }

    const senioritySelect = page.locator('ng-select').filter({ hasText: 'Select Seniority' }).first();
    if (await senioritySelect.count() > 0) {
        const names = ['CXO', 'Manager', 'Partner', 'Owner', 'Entry', 'Senior', 'Director', 'Training', 'Unpaid', 'VP'];
        let panel = await openNgSelect(page, senioritySelect);
        for (const name of names) {
            const opt = panel.locator('.ng-option', { hasText: name }).first();
            if ((await opt.count()) === 0) {
                // Option not in current view — reopen panel
                panel = await openNgSelect(page, senioritySelect);
            }
            if ((await opt.count()) > 0) {
                try {
                    await opt.evaluate(el => el.click());
                    // 50ms is enough for Angular to register the multi-select tick
                    await page.waitForTimeout(50);
                    if (!(await panel.isVisible().catch(() => false))) {
                        panel = await openNgSelect(page, senioritySelect);
                    }
                } catch (e) {}
            }
        }
        if ((await page.locator('body .ng-dropdown-panel').first().isVisible().catch(() => false))) {
            await page.keyboard.press('Escape');
        }
    }

    await page.getByPlaceholder('Enter total budget').fill('11');
    await page.getByPlaceholder('Enter daily budget').fill('11');

    await page.locator('div').filter({ hasText: `${campaignName} Awareness display` }).nth(5).click();
    await page.getByRole('button', { name: 'Create Ads Ads' }).click();
    await page.getByRole('textbox', { name: 'Search ads' }).fill(adName);
    await expect(page.getByRole('heading', { name: adName })).toBeVisible({ timeout: config.TIMEOUT });

    const adHeading = page.getByRole('heading', { name: adName });
    const clickedInRow = await adHeading.evaluate((el) => {
        let node = el;
        while (node && node !== document.body) {
            const cb = node.querySelector('input[type="checkbox"], [role="checkbox"]');
            if (cb) { cb.click(); return true; }
            node = node.parentElement;
        }
        return false;
    });
    if (!clickedInRow) {
        await page.getByRole('checkbox').first().click();
    }

    // Some flows show a "Yes" confirmation after selecting an ad; click it when present.
    const confirmYes = page.getByRole('button', { name: 'Yes' });
    if (await confirmYes.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmYes.click();
    }
    await page.getByRole('button', { name: 'Add to campaign' }).click();

    await page.getByLabel('Customize Locations').click();
    const locationSelect = page.getByLabel('Customize Locations').locator('xpath=following::ng-select[1]');
    await locationSelect.waitFor({ state: 'visible', timeout: config.TIMEOUT });
    await openNgSelect(page, locationSelect);
    await page.keyboard.type('united');
    await page.getByRole('option', { name: 'United States', exact: true }).click();

    await page.keyboard.press('Escape');

    const accountPaddingBox = page.getByRole('checkbox', { name: 'Enable Account Padding' });
    if (!(await accountPaddingBox.isChecked().catch(() => false))) {
        await accountPaddingBox.check();
    }

    const linkedInAudienceBox = page.getByRole('checkbox', { name: 'Enable LinkedIn Audience' });
    if (!(await linkedInAudienceBox.isChecked().catch(() => false))) {
        await linkedInAudienceBox.check();
    }


    await page.getByRole('button', { name: 'Activate Activate' }).click();

    await expect(page.getByLabel('Success', { exact: true })).toBeVisible({ timeout: config.TIMEOUT });
    await expect(page.getByLabel('Campaign Status Updated')).toContainText('Campaign Status Updated Successfully');
    await expect(page.getByRole('button')).toContainText('Review Launch Status');

    // Wait briefly for any post-activation state (launched toast OR couldn't-launch modal)
    const launched = await page.getByText('Your campaign is being launched.').isVisible({ timeout: 8000 }).catch(() => false);
    const couldntLaunch = await page.getByText("We couldn't launch this campaign.").isVisible({ timeout: 3000 }).catch(() => false);
    logger.info(launched ? 'Campaign launched successfully' : couldntLaunch ? 'Campaign could not launch (audience too small), continuing' : 'Activation state unknown, continuing');

    // Close any modal that may be blocking the page (e.g. "couldn't launch" or success dialog)
    const modal = page.locator('ngb-modal-window');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.keyboard.press('Escape').catch(() => {});
        await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(async () => {
            await page.mouse.click(10, 10).catch(() => {});
        });
    }


    await openCampaignsList(page);
    await page.getByRole('textbox', { name: 'Search' }).fill(campaignName);
    await expect(page.getByRole('link', { name: campaignName })).toBeVisible({ timeout: config.TIMEOUT });
    const campaignRow = page.locator('tbody tr').filter({ hasText: campaignName });
    await expect(campaignRow).toHaveCount(1, { timeout: config.TIMEOUT });
    await expect(campaignRow.first()).toContainText(campaignName);
        await expect(campaignRow.first()).toContainText('active');

    logger.testEnd('should create a new campaign successfully', 'passed');
};

module.exports = { createCampaign, openCampaignsList };
