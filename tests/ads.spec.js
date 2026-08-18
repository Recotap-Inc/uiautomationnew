'use strict';

const { test } = require('../fixtures/baseFixtures');
const { createAd } = require('../helpers/adHelpers');

test.describe('Ads', () => {
    test('Create ad and verify in list', async ({ authenticatedPage }) => {
        await createAd(authenticatedPage);
    });
});
