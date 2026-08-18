'use strict';

const { test } = require('../fixtures/baseFixtures');
const { createSegmentAndVerifyInList } = require('../helpers/segmentHelpers');

test.describe('Segments', () => {
    test('Create segment and verify in list', async ({ authenticatedPage }) => {
        await createSegmentAndVerifyInList(authenticatedPage);
    });
});
