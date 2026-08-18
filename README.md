# Recotap UI - Playwright Test Framework

A comprehensive end-to-end testing framework built with Playwright for the Recotap UI application.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Reports](#test-reports)
- [Writing Tests](#writing-tests)
- [Page Object Model](#page-object-model)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Page Object Model (POM)** - Clean separation of test logic and page elements
- **Custom Fixtures** - Reusable test fixtures for common setup
- **Multiple Environments** - Support for dev, staging, and production environments
- **Comprehensive Logging** - Detailed test execution logs with timestamps
- **Data-Driven Testing** - Test data management with JSON files
- **Security Testing** - XSS and SQL injection tests
- **Multi-Browser Support** - Test on Chromium, Firefox, WebKit, and mobile browsers
- **Screenshot & Video** - Automatic capture on test failure
- **Parallel Execution** - Run tests in parallel for faster execution
- **Custom Utilities** - Helper functions for common operations

## 📁 Project Structure

```
recotap-ui/
├── config/
│   └── environment.js          # Environment-specific configuration
├── fixtures/
│   └── baseFixtures.js         # Custom test fixtures
├── pages/
│   ├── BasePage.js             # Base page object with common methods
│   └── LoginPage.js            # Login page object model
├── reports/
│   ├── logs/                   # Test execution logs
│   └── screenshots/            # Failure screenshots
├── test-data/
│   └── loginData.json          # Test data for login tests
├── tests/
│   ├── login.spec.js           # Original login tests
│   └── login.spec.js       # Login tests using POM
├── utils/
│   ├── dataGenerator.js        # Random test data generator
│   ├── helpers.js              # Common helper utilities
│   └── logger.js               # Custom logger
├── .env.example                # Environment variables template
├── playwright.config.js        # Playwright configuration
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

## 🔧 Prerequisites

- **Node.js** - Version 16 or higher
- **npm** - Version 7 or higher

## 📦 Installation

1. **Clone the repository**
   ```bash
   cd recotap-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npm run install:browsers
   ```

4. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## ⚙️ Configuration

### Environment Configuration

Set the test environment using the `TEST_ENV` variable:

- **dev** - Development environment
- **staging** - Staging environment
- **production** - Production environment (default)

Edit [config/environment.js](config/environment.js) to update environment-specific settings.

### Playwright Configuration

The [playwright.config.js](playwright.config.js) file contains:

- Test timeout settings
- Browser configurations
- Screenshot/video settings
- Parallel execution settings
- Reporter configurations

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests in UI mode (interactive)
npm run test:ui

# Debug tests
npm run test:debug
```

### Environment-Specific Tests

```bash
# Run tests in dev environment
npm run test:dev

# Run tests in staging environment
npm run test:staging

# Run tests in production environment
npm run test:prod
```

### Browser-Specific Tests

```bash
# Run tests on Chromium
npm run test:chromium

# Run tests on Firefox
npm run test:firefox

# Run tests on WebKit
npm run test:webkit

# Run tests on mobile browsers
npm run test:mobile
```

### Test-Specific Commands

```bash
# Run only login tests (original)
npm run test:login

# Run only login tests with POM
npm run test:login

# Run specific test file
npx playwright test tests/login.spec.js

# Run tests matching a pattern
npx playwright test --grep "successful login"
```

### Parallel/Serial Execution

```bash
# Run tests in parallel (4 workers)
npm run test:parallel

# Run tests serially (1 worker)
npm run test:serial
```

## 📊 Test Reports

### View HTML Report

```bash
# Open the HTML report
npm run report

# Or manually open
npm run report:open
```

### Report Locations

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `reports/test-results.json`
- **JUnit Report**: `reports/junit-results.xml`
- **Logs**: `reports/logs/test-execution-YYYY-MM-DD.log`
- **Screenshots**: `reports/screenshots/`

### Clean Reports

```bash
# Clean old reports
npm run clean:reports
```

## ✍️ Writing Tests

### Using Page Object Model

```javascript
const { test, expect } = require('../fixtures/baseFixtures');
const config = require('../config/environment');

test.describe('My Test Suite', () => {

    test('example test', async ({ loginPage }) => {
        // Navigate to login page
        await loginPage.goto(config.BASE_URL);

        // Perform login
        await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);

        // Verify success
        await loginPage.verifySuccessfulLogin(config.BASE_URL);
    });
});
```

### Using Test Data

```javascript
const loginData = require('../test-data/loginData.json');

test('test with data', async ({ loginPage }) => {
    for (const creds of loginData.invalidCredentials) {
        await loginPage.login(creds.email, creds.password);
        // Add assertions
    }
});
```

### Using Custom Fixtures

```javascript
test('test with custom fixture', async ({ loginPage, testData, authenticatedPage }) => {
    // loginPage - Login page object
    // testData - Test data fixture
    // authenticatedPage - Already logged in page
});
```

## 🎯 Page Object Model

### Creating a New Page Object

```javascript
const { expect } = require('@playwright/test');

class MyPage {
    constructor(page) {
        this.page = page;
        this.myButton = page.locator('#myButton');
    }

    async clickButton() {
        await this.myButton.click();
    }
}

module.exports = MyPage;
```

### Extending BasePage

```javascript
const BasePage = require('./BasePage');

class MyPage extends BasePage {
    constructor(page) {
        super(page);
        this.myButton = page.locator('#myButton');
    }
}

module.exports = MyPage;
```

## 🎨 Best Practices

### Test Organization

1. Group related tests using `test.describe()`
2. Use meaningful test names that describe the expected behavior
3. Keep tests independent and isolated
4. Use `beforeEach` for common setup

### Page Objects

1. Encapsulate all page elements and actions in page objects
2. Use descriptive names for locators and methods
3. Keep page objects focused on a single page
4. Add JSDoc comments for methods

### Test Data

1. Store test data in JSON files
2. Use data generators for dynamic data
3. Never hardcode sensitive data
4. Separate test data from test logic

### Assertions

1. Use Playwright's built-in assertions
2. Add descriptive error messages
3. Verify both positive and negative scenarios
4. Test edge cases

### Logging

1. Use the custom logger for important events
2. Log test start and end
3. Log key actions and verifications
4. Include relevant data in logs

## 🐛 Troubleshooting

### Common Issues

**Tests are failing randomly**
- Increase timeouts in `playwright.config.js`
- Add explicit waits for elements
- Check for race conditions

**Browser not launching**
- Run `npm run install:browsers`
- Check if browsers are installed correctly
- Try running in headed mode

**Element not found**
- Verify locators are correct
- Wait for page to load completely
- Check if element is in iframe

**Tests are slow**
- Run tests in parallel
- Optimize wait times
- Use `networkidle` wisely

### Debug Mode

```bash
# Run in debug mode with Playwright Inspector
npm run test:debug

# Or for specific test
npx playwright test --debug tests/login.spec.js
```

### Verbose Logging

```bash
# Enable debug logging
DEBUG=true npm test
```

## 📝 Test Coverage

Current test coverage includes:

- ✅ Successful login scenarios
- ✅ Failed login scenarios
- ✅ Form validation
- ✅ UI and accessibility
- ✅ Security (XSS, SQL injection)
- ✅ Performance testing
- ✅ Browser compatibility
- ✅ Mobile responsiveness

## 🤝 Contributing

1. Create a feature branch
2. Write tests following the framework patterns
3. Ensure all tests pass
4. Update documentation if needed
5. Submit a pull request

## 📄 License

ISC

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: February 2026
# uiautomation-revamp
