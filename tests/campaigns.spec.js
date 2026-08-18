"use strict";

const { test, expect } = require("../fixtures/baseFixtures");
const { createAccount } = require("../helpers/accountHelpers");
const { createSegmentAndVerifyInList } = require("../helpers/segmentHelpers");
const { createAd } = require("../helpers/adHelpers");
const {
    createCampaign,
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
});
