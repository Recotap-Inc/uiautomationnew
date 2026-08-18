import { test } from '../fixtures/baseFixtures.js';
import config from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { createAccount } from '../helpers/accountHelpers.js';
import { createSegmentAndVerifyInList } from '../helpers/segmentHelpers.js';
import { createAd } from '../helpers/adHelpers.js';
import { createCampaign } from '../helpers/campaignHelpers.js';

test.describe('Sanity Tests', () => {

    test.beforeEach(async ({}, testInfo) => {
        logger.testStart(testInfo.title);
    });

    test.afterEach(async ({ }, testInfo) => {
        logger.testEnd(testInfo.title, testInfo.status);
    });

    test('should successfully login with valid credentials', async ({ loginPage }) => {
        logger.info('Attempting login with valid credentials');
        await loginPage.goto(config.BASE_URL);
        await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);
        await loginPage.verifySuccessfulLogin(config.BASE_URL);
    });

    test('Create account', async ({ authenticatedPage }) => {
        await createAccount(authenticatedPage);
    });

    test('Create segment and verify in list', async ({ authenticatedPage }) => {
        await createSegmentAndVerifyInList(authenticatedPage);
    });

    test('Create ad and verify in list', async ({ authenticatedPage }) => {
        await createAd(authenticatedPage);
    });

    test('should create a new campaign successfully', async ({ authenticatedPage }) => {
        await createCampaign(authenticatedPage);
    });

});
