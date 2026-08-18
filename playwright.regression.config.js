// @ts-check
const baseConfig = require('./playwright.config');

/**
 * Regression suite config
 * Runs all .spec.js files using the existing framework settings.
 */
module.exports = {
  ...baseConfig,
  testMatch: ['tests/regression.spec.js']
};
