// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
const config = defineConfig({
  // Test directory
  testDir: './tests',

  // Maximum time one test can run
  timeout: 120 * 1000,

  // Expect timeout
  expect: {
    timeout: 10 * 1000,
  },

  // Run tests in files in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  workers: process.env.CI ? 1 : 1,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'https://abm.recotap.com/',

    // Browser options (default: headless mode)
    headless: process.env.HEADLESS !== 'true',

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport size
    viewport: { width: 1920, height: 1080 },

    // Action timeout
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Slow down operations by specified milliseconds (useful for debugging)
    slowMo: parseInt(process.env.SLOW_MO || '0'),
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    }/* ,

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox']
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari']
      },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5']
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12']
      },
    },

    // Tablet viewports
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro']
      },
    }, */
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./config/global-setup.js'),
  // globalTeardown: require.resolve('./config/global-teardown.js'),

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',

  // Web server configuration (if you need to start a local server)
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  //   timeout: 120 * 1000,
  //   reuseExistingServer: !process.env.CI,
  // },
});

module.exports = config;