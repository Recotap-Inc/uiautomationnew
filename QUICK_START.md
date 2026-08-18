# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
npm run install:browsers
```

### 2. Run Your First Test
```bash
# Run the POM-based login tests
npm run test:login
```

### 3. View Test Report
```bash
npm run report
```

## 📝 Common Commands Cheat Sheet

### Running Tests

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:ui` | Run in interactive UI mode |
| `npm run test:debug` | Debug tests with Playwright Inspector |
| `npm run test:login` | Run login tests (POM version) |

### Browser-Specific

| Command | Description |
|---------|-------------|
| `npm run test:chromium` | Run on Chrome/Chromium |
| `npm run test:firefox` | Run on Firefox |
| `npm run test:webkit` | Run on Safari/WebKit |
| `npm run test:mobile` | Run on mobile browsers |

### Environment-Specific

| Command | Description |
|---------|-------------|
| `npm run test:dev` | Run in dev environment |
| `npm run test:staging` | Run in staging environment |
| `npm run test:prod` | Run in production environment |

### Reports & Cleanup

| Command | Description |
|---------|-------------|
| `npm run report` | Open HTML report |
| `npm run clean:reports` | Clean old reports |

## 🎯 Quick Test Examples

### Example 1: Simple Login Test
```javascript
const { test, expect } = require('../fixtures/baseFixtures');
const config = require('../config/environment');

test('login test', async ({ loginPage }) => {
    await loginPage.goto(config.BASE_URL);
    await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);
    await loginPage.verifySuccessfulLogin(config.BASE_URL);
});
```

### Example 2: Data-Driven Test
```javascript
const loginData = require('../test-data/loginData.json');

test('test invalid credentials', async ({ loginPage }) => {
    for (const creds of loginData.invalidCredentials) {
        await loginPage.login(creds.email, creds.password);
        await loginPage.verifyOnLoginPage(config.BASE_URL);
    }
});
```

### Example 3: Using Custom Fixtures
```javascript
test('use test data fixture', async ({ loginPage, testData }) => {
    await loginPage.login(testData.validEmail, testData.validPassword);
});
```

## 🔍 Debugging Tips

### Run Single Test
```bash
npx playwright test tests/login.spec.js -g "should successfully login"
```

### Debug Mode
```bash
npx playwright test --debug
```

### Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Slow Motion (500ms delay between actions)
```bash
SLOW_MO=500 npx playwright test --headed
```

## 📊 Understanding Test Results

### Test Status Icons
- ✅ Passed
- ❌ Failed
- ⏭️ Skipped
- 🔄 Flaky

### Check Logs
```bash
# View today's logs
cat reports/logs/test-execution-$(date +%Y-%m-%d).log

# Follow logs in real-time
tail -f reports/logs/test-execution-$(date +%Y-%m-%d).log
```

## 🛠️ Framework Structure at a Glance

```
├── pages/              # Page Object Models
│   ├── BasePage.js    # Common page methods
│   └── LoginPage.js   # Login page specific methods
├── fixtures/          # Custom test fixtures
├── tests/             # Your test files
├── test-data/         # Test data (JSON)
├── utils/             # Helper utilities
├── config/            # Environment configs
└── reports/           # Test reports & logs
```

## 📚 Next Steps

1. ✅ Run the example tests
2. ✅ Review the test reports
3. ✅ Explore the [README.md](README.md) for detailed documentation
4. ✅ Create your first test using the Page Object Model
5. ✅ Add test data in `test-data/`
6. ✅ Create new page objects in `pages/`

## 🐛 Common Issues

### Issue: Tests fail with timeout
**Solution**: Increase timeout in `playwright.config.js`

### Issue: Element not found
**Solution**: Add wait for element or check selector

### Issue: Browser not launching
**Solution**: Run `npm run install:browsers`

## 💡 Pro Tips

1. **Use test.only during development**
   ```javascript
   test.only('focused test', async ({ loginPage }) => {
       // Only this test will run
   });
   ```

2. **Run specific test file**
   ```bash
   npx playwright test tests/login.spec.js
   ```

3. **Filter by test name**
   ```bash
   npx playwright test --grep "login"
   ```

4. **Generate code automatically**
   ```bash
   npx playwright codegen https://abm.recotap.com/
   ```

## 📞 Need Help?

- Check [README.md](README.md) for full documentation
- Review existing tests in `tests/` folder
- Check Playwright docs: https://playwright.dev

---

Happy Testing! 🎉
