'use strict';

const { test } = require('../fixtures/baseFixtures');
const { createAccount } = require('../helpers/accountHelpers');
const { createSegmentAndVerifyInList } = require('../helpers/segmentHelpers');
const { createAd } = require('../helpers/adHelpers');
const { createCampaign } = require('../helpers/campaignHelpers');
const Helpers = require('../utils/helpers');

// Self-contained test data so this spec runs correctly on its own.
// Unique IDs prevent conflicts with data created by other spec files.
const CAMPAIGN_ACCOUNT_DATA = {
    domain: `camptest-${Helpers.generateUniqueId()}.com`,
    accountName: 'Campaign Test Account',
    shortName: 'camptest',
    industry: 'Internet News',
    revenueRange: '$5M - $10M',
    employeeRange: '10K - 50K',
    hqLocation: 'United Kingdom',
    tagValue: `camptag-${Helpers.generateUniqueId()}`
};

const CAMPAIGN_SEGMENT_DATA = { name: `campseg-${Helpers.generateUniqueId()}` };
const CAMPAIGN_AD_DATA = { name: `campad-${Helpers.generateUniqueId()}`, url: 'https://www.recotap1.com' };

// serial: runs in order; skips remaining tests if any prerequisite step fails
test.describe.serial('Campaigns', () => {

    test('prerequisite - create account with tag', async ({ authenticatedPage }) => {
        await createAccount(authenticatedPage, CAMPAIGN_ACCOUNT_DATA);
    });

    test('prerequisite - create segment', async ({ authenticatedPage }) => {
        await createSegmentAndVerifyInList(authenticatedPage, CAMPAIGN_SEGMENT_DATA, CAMPAIGN_ACCOUNT_DATA);
    });

    test('prerequisite - create ad', async ({ authenticatedPage }) => {
        await createAd(authenticatedPage, CAMPAIGN_AD_DATA);
    });

    test('should create a new campaign successfully', async ({ authenticatedPage }) => {
        await createCampaign(authenticatedPage, CAMPAIGN_SEGMENT_DATA.name, CAMPAIGN_AD_DATA.name);
    });

});
