"use strict";

const { test, expect } = require("../fixtures/baseFixtures");
const config = require("../config/environment");
const { logger } = require("../utils/logger");
const { createAccount } = require("../helpers/accountHelpers");
const { createSegmentAndVerifyInList } = require("../helpers/segmentHelpers");
const { createAd } = require("../helpers/adHelpers");
const {
    createCampaign,
    createCampaignDraft,
    openCampaignsList,
} = require("../helpers/campaignHelpers");
const Helpers = require("../utils/helpers");

// Self-contained test data so this spec runs correctly on its own.
// Unique IDs prevent conflicts with data created by other spec files.
const CAMPAIGN_ACCOUNT_DATA = {
    domain: `camptest-${Helpers.generateUniqueId()}.com`,
    accountName: "Campaign Test Account",
    shortName: "camptest",
    industry: "Internet News",
    revenueRange: "$5M - $10M",
    employeeRange: "10K - 50K",
    hqLocation: "United Kingdom",
    tagValue: `camptag-${Helpers.generateUniqueId()}`,
};

const CAMPAIGN_SEGMENT_DATA = { name: `campseg-${Helpers.generateUniqueId()}` };
const CAMPAIGN_AD_DATA = {
    name: `campad-${Helpers.generateUniqueId()}`,
    url: "https://www.recotap1.com",
};

// serial: runs in order; skips remaining tests if any prerequisite step fails
test.describe.serial("Campaigns", () => {
    test("prerequisite - create account with tag", async ({
        authenticatedPage,
    }) => {
        await createAccount(authenticatedPage, CAMPAIGN_ACCOUNT_DATA);
    });

    test("prerequisite - create segment", async ({ authenticatedPage }) => {
        await createSegmentAndVerifyInList(
            authenticatedPage,
            CAMPAIGN_SEGMENT_DATA,
            CAMPAIGN_ACCOUNT_DATA,
        );
    });

    test("prerequisite - create ad", async ({ authenticatedPage }) => {
        await createAd(authenticatedPage, CAMPAIGN_AD_DATA);
    });

    test("should crseate a new campaign successfully", async ({
        authenticatedPage,
    }) => {
        await createCampaign(
            authenticatedPage,
            CAMPAIGN_SEGMENT_DATA.name,
            CAMPAIGN_AD_DATA.name,
        );
    });

});

test.describe("Campaign Modal Validation", () => {
    test("Create campaign modal field validation", async ({
        authenticatedPage: page,
    }) => {
        await openCampaignsList(page);

        const createButton = page.getByRole("button", { name: "Create Campaign" });
        await createButton.first().click();
        await expect(page.getByTitle("Create Campaign")).toBeVisible();
        await expect(page.getByText("Name is required")).toBeVisible();

        const nameBox = page.getByRole("textbox", { name: "Enter campaign name" });
        await nameBox.click();
        await nameBox.fill("autocamp1");
        await expect(page.getByText("Name is required")).not.toBeVisible();

        // Default selections when the modal opens
        await expect(page.locator("#create_update_campaign_type_one_to_one")).toBeChecked();
        await expect(page.locator("#create_update_campaign_type_one_to_many")).not.toBeChecked();

        await expect(page.locator("#create_update_goal_type_awareness")).toBeChecked();
        await expect(page.locator("#create_update_goal_type_website_visits")).not.toBeChecked();
        await expect(page.locator("#create_update_goal_type_linkedin")).not.toBeChecked();

        await expect(page.locator("#create_update_ad_type_display")).toBeChecked();
        await expect(page.locator("#create_update_ad_type_video")).not.toBeChecked();
        await expect(page.locator("#create_update_ad_type_carousel")).not.toBeChecked();

        await expect(
            page.locator('ng-select[formcontrolname="language"] .ng-value-label')
        ).toHaveText("English");


        await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    });

    test("validate Cancel button closes the create campaign modal", async ({
        authenticatedPage: page,
    }) => {
        logger.testStart("validate Cancel button closes the create campaign modal");

        await openCampaignsList(page);

        const createButton = page.getByRole("button", { name: "Create Campaign" });
        await createButton.first().click();
        await expect(page.getByTitle("Create Campaign")).toBeVisible({ timeout: config.TIMEOUT });

        await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible({ timeout: config.TIMEOUT });
        await page.getByRole("button", { name: "Cancel" }).click();
        await expect(page.getByTitle("Create Campaign")).not.toBeVisible({ timeout: config.TIMEOUT });

        logger.testEnd("validate Cancel button closes the create campaign modal", "passed");
    });

    test("Validate data persistence from Create Campaign modal to Configure Campaign page", async ({
        authenticatedPage: page,
    }) => {
        logger.testStart("Validate data persistence from Create Campaign modal to Configure Campaign page");

        const campaignName = `testcampaign${Helpers.getTimestamp("MMDDHHMM")}`;

        await openCampaignsList(page);

        const createButton = page.getByRole("button", { name: "Create Campaign" });
        await createButton.first().click();
        await expect(page.getByTitle("Create Campaign")).toBeVisible({ timeout: config.TIMEOUT });

        const nameBox = page.getByRole("textbox", { name: "Enter campaign name" });
        await nameBox.click();
        await nameBox.fill(campaignName);

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByRole('heading', { name: 'Configure Campaign' })).toBeVisible({ timeout: config.TIMEOUT });
        await expect(page.getByRole('heading', { name: campaignName })).toBeVisible({ timeout: config.TIMEOUT });

        await expect(page.getByText('Awareness')).toBeVisible();

        await expect(page.getByText('display')).toBeVisible();
        await expect(page.getByText('English')).toBeVisible();
        await expect(page.locator('#kt_app_main').getByText('Accounts', { exact: true })).toBeVisible();
        await expect(page.getByText('1:1 ABM')).toBeVisible();

        await expect(page.locator('button').filter({ hasText: 'Edit' })).toBeVisible();

        logger.testEnd("Validate data persistence from Create Campaign modal to Configure Campaign page", "passed");
    });
 test("Validate Edit button navigation from Configure Campaign page", async ({
        authenticatedPage: page,
 })=> {
        logger.testStart("Validate Edit button navigation from Configure Campaign page");

        const campaignName = `testcampaign${Helpers.getTimestamp("MMDDHHMM")}`;

        // Non-default options so persistence into the Edit Campaign modal is meaningful
        await createCampaignDraft(page, {
            name: campaignName,
            campaignType: "one_to_many",
            goalType: "website_visits",
            adType: "video",
        });

        const pageEditButton = page.getByRole('button', { name: 'Edit' });
        const confirmDialog = page.getByRole('dialog');

        // Clicking Edit warns the user before leaving the Configure Campaign page
        await expect(pageEditButton).toBeVisible();
        await pageEditButton.click();
        await expect(confirmDialog.getByText('Are you sure you want to edit')).toBeVisible();

        // Cancelling the warning should keep the user on the Configure Campaign page
        await confirmDialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(confirmDialog).not.toBeVisible();
        await expect(page.getByRole('heading', { name: 'Configure Campaign' })).toBeVisible({ timeout: config.TIMEOUT });
        await expect(page.getByRole('heading', { name: campaignName })).toBeVisible({ timeout: config.TIMEOUT });

        // Edit again and confirm this time to proceed into the Edit Campaign modal
        await pageEditButton.click();
        await expect(confirmDialog.getByText('Are you sure you want to edit')).toBeVisible();
        await confirmDialog.getByRole('button', { name: 'Edit' }).click();
        await expect(page.getByText('Edit Campaign')).toBeVisible({ timeout: config.TIMEOUT });

        // Data entered on the Create Campaign modal should persist into the Edit Campaign modal
        await expect(page.getByRole('textbox', { name: 'Enter campaign name' })).toHaveValue(campaignName);
        await expect(page.locator('#create_update_campaign_type_one_to_many')).toBeChecked();
        await expect(page.locator('#create_update_goal_type_website_visits')).toBeChecked();
        await expect(page.locator('#create_update_ad_type_video')).toBeChecked();
        await expect(
            page.locator('ng-select[formcontrolname="language"] .ng-value-label')
        ).toHaveText('English');

        await page.getByRole('img', { name: 'close modal' }).click();
        await expect(page.getByText('Edit Campaign')).not.toBeVisible({ timeout: config.TIMEOUT });

        logger.testEnd("Validate Edit button navigation from Configure Campaign page", "passed");
  });
});
