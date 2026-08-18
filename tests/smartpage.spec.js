'use strict';

const { test } = require('../fixtures/baseFixtures');
const { createAccount, ACCOUNT_TEST_DATA } = require('../helpers/accountHelpers');
const { createSegmentAndVerifyInList, SEGMENT_TEST_DATA } = require('../helpers/segmentHelpers');
const { createSmartPage, editAndPublishSmartPage, SMART_PAGE_TEST_DATA } = require('../helpers/smartPageHelpers');

test.describe.serial('Smart Pages', () => {

    test('prerequisite - create account with tag', async ({ authenticatedPage }) => {
        await createAccount(authenticatedPage, ACCOUNT_TEST_DATA);
    });

    test('prerequisite - create segment', async ({ authenticatedPage }) => {
        await createSegmentAndVerifyInList(authenticatedPage, SEGMENT_TEST_DATA, ACCOUNT_TEST_DATA);
    });

    test('should create a smart page with personalisation', async ({ authenticatedPage }) => {
        await createSmartPage(authenticatedPage, SMART_PAGE_TEST_DATA);
    });

    test('should edit and publish the smart page', async ({ authenticatedPage }) => {
        await editAndPublishSmartPage(authenticatedPage, SMART_PAGE_TEST_DATA.name, ACCOUNT_TEST_DATA);
    });

});
