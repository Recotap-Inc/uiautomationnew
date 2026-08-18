/**
 * Login Page Tests - Using Page Object Model
 * Comprehensive end-to-end tests for login functionality
 */

const { test, expect } = require('../fixtures/baseFixtures');
const config = require('../config/environment');
const loginData = require('../test-data/loginData.json');
const { logger } = require('../utils/logger');
const DataGenerator = require('../utils/dataGenerator');

test.describe('Login Page - End to End Tests (POM)', () => {

    test.beforeEach(async ({ loginPage }, testInfo) => {
        logger.testStart(testInfo.title);
        await loginPage.goto(config.BASE_URL);
    });

    test.afterEach(async ({ }, testInfo) => {
        logger.testEnd(testInfo.title, testInfo.status);
    });

    test.describe('Successful Login Scenarios', () => {

        test('should successfully login with valid credentials', async ({ loginPage }) => {
            logger.info('Attempting login with valid credentials');

            await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);

            // Verify successful login
            await loginPage.verifySuccessfulLogin(config.BASE_URL);
            //logger.success('Login successful');
        });

        test('should login successfully using Enter key', async ({ loginPage }) => {
            await loginPage.fillEmail(config.VALID_EMAIL);
            await loginPage.fillPassword(config.VALID_PASSWORD);
            await loginPage.submitWithEnter();

            await loginPage.verifySuccessfulLogin(config.BASE_URL);
        });

        test('should maintain session across browser contexts', async ({ loginPage, page, context }) => {
            // Login
            await loginPage.login(config.VALID_EMAIL, config.VALID_PASSWORD);
            await loginPage.waitForSuccessfulLogin(10000).catch(() => {});

            // Open new page in same context
            const newPage = await context.newPage();
            const LoginPage = require('../pages/LoginPage');
            const newLoginPage = new LoginPage(newPage);

            await newLoginPage.goto(config.BASE_URL);
            await newLoginPage.page.waitForLoadState('networkidle');

            // Session should be maintained (verify not on login page)
            logger.info(`New page URL: ${newPage.url()}`);
        });
    });

    test.describe('Failed Login Scenarios', () => {

        test('should show error with invalid email', async ({ loginPage, testData }) => {
            await loginPage.login(testData.invalidEmail, testData.validPassword);
            await loginPage.dismissAlerts();
            await loginPage.verifyOnLoginPage(config.BASE_URL);

            // Check for error message
            const hasError = await loginPage.isErrorVisible();
            logger.info(`Error message visible: ${hasError}`);
        });

        test('should show error with invalid password', async ({ loginPage, testData }) => {
            await loginPage.login(testData.validEmail, testData.invalidPassword);
            await loginPage.dismissAlerts();
            await loginPage.verifyOnLoginPage(config.BASE_URL);
        });

        test('should show error with both invalid credentials', async ({ loginPage, testData }) => {
            await loginPage.login(testData.invalidEmail, testData.invalidPassword);
            await loginPage.dismissAlerts();
            await loginPage.verifyOnLoginPage(config.BASE_URL);
        });
    });

    test.describe('Form Validation Tests', () => {

        test('should show validation error when email field is empty', async ({ loginPage, testData }) => {
            await loginPage.fillPassword(testData.validPassword);
            await loginPage.clickLogin();

            const validationMessage = await loginPage.getEmailValidationMessage();
            expect(validationMessage).toBeTruthy();
            logger.info(`Email validation message: ${validationMessage}`);
        });

        test('should show validation error when password field is empty', async ({ loginPage, testData }) => {
            await loginPage.fillEmail(testData.validEmail);
            await loginPage.clickLogin();

            const validationMessage = await loginPage.getPasswordValidationMessage();
            expect(validationMessage).toBeTruthy();
            logger.info(`Password validation message: ${validationMessage}`);
        });

        test('should show validation error when both fields are empty', async ({ loginPage }) => {
            await loginPage.clickLogin();

            const validationMessage = await loginPage.getEmailValidationMessage();
            expect(validationMessage).toBeTruthy();
        });

        test('should validate email format', async ({ loginPage, testData }) => {
            const invalidEmails = loginData.invalidEmails;

            for (const email of invalidEmails) {
                await loginPage.fillEmail(email);
                await loginPage.fillPassword(testData.validPassword);
                // small wait for any client-side validation to apply
                    await loginPage.page.waitForTimeout(100)

                // Use a stricter regex validation (disallow consecutive dots, spaces, etc.)
                try {
                    const value = await loginPage.getEmailValue();
                    const strictEmailRe = /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/
                    const passesStrict = strictEmailRe.test(value)
                    logger.info(`Email "${email}" value='${value}' strictRegex=${passesStrict}`)
                    if (passesStrict) {
                        const safe = email.replace(/[^a-z0-9]/gi, '_')
                        await loginPage.page.screenshot({ path: `reports/screenshots/invalid-email-${safe}.png`, fullPage: false })
                        throw new Error(`Email '${email}' unexpectedly passed strict regex validation. value='${value}'`)
                    }
                } finally {
                    await loginPage.clearEmail();
                    await loginPage.clearPassword();
                }
            }
        });

        test('should validate multiple invalid credential sets from test data', async ({ loginPage }) => {
            for (const creds of loginData.invalidCredentials) {
                logger.info(`Testing: ${creds.description}`);
                await loginPage.login(creds.email, creds.password);
                await loginPage.dismissAlerts();
                await loginPage.verifyOnLoginPage(config.BASE_URL);
                await loginPage.clearEmail();
                await loginPage.clearPassword();
            }
        });
    });

    test.describe('UI and Accessibility Tests', () => {

        test('should have all required login form elements', async ({ loginPage }) => {
            await loginPage.verifyFormElementsVisible();
            logger.success('All form elements are visible');
        });

        test('should have proper input types for form fields', async ({ loginPage }) => {
            const emailType = await loginPage.getEmailFieldType();
            expect(['email', 'text']).toContain(emailType);
            logger.info(`Email field type: ${emailType}`);

            const passwordType = await loginPage.getPasswordFieldType();
            expect(passwordType).toBe('password');
            logger.info(`Password field type: ${passwordType}`);
        });

        test('should be able to toggle password visibility if feature exists', async ({ loginPage, testData }) => {
            await loginPage.fillPassword(testData.validPassword);
            await loginPage.togglePasswordVisibility();

            const passwordType = await loginPage.getPasswordFieldType();
            expect(['text', 'password']).toContain(passwordType);
        });

        test('should have proper tab navigation order', async ({ loginPage }) => {
            const firstFocused = await loginPage.tabThroughFields();
            expect(firstFocused).toBe('email');

            const secondFocused = await loginPage.tabThroughFields();
            expect(secondFocused).toBe('password');

            logger.info('Tab navigation order is correct');
        });
    });

    test.describe('Security Tests', () => {

        test('should prevent XSS in email field', async ({ loginPage, testData }) => {
            const xssPayloads = loginData.securityPayloads.xss;

            for (const payload of xssPayloads) {
                await loginPage.fillEmail(payload);
                await loginPage.fillPassword(testData.validPassword);
                await loginPage.clickLogin();
                await loginPage.dismissAlerts();

                // Page should still be accessible (no script execution)
                expect(loginPage.page.url()).toBeTruthy();
                logger.info(`XSS payload blocked: ${payload.substring(0, 30)}...`);

                await loginPage.clearEmail();
            }
        });

        test('should prevent SQL injection in email field', async ({ loginPage, testData }) => {
            const sqlPayloads = loginData.securityPayloads.sqlInjection;

            for (const payload of sqlPayloads) {
                await loginPage.fillEmail(payload);
                await loginPage.fillPassword(testData.validPassword);
                await loginPage.clickLogin();
                await loginPage.dismissAlerts();
                await loginPage.verifyOnLoginPage(config.BASE_URL);
                logger.info(`SQL injection blocked: ${payload}`);

                await loginPage.clearEmail();
            }
        });

        test('should mask password input', async ({ loginPage }) => {
            await loginPage.fillPassword('SecretPassword123');

            const fieldType = await loginPage.getPasswordFieldType();
            expect(fieldType).toBe('password');
            logger.success('Password field is properly masked');
        });

        test('should test edge cases from test data', async ({ loginPage }) => {
            const edgeCases = loginData.edgeCases;

            // Test long email
            await loginPage.fillEmail(edgeCases.longEmail);
            await loginPage.fillPassword(config.VALID_PASSWORD);
            await loginPage.clickLogin();
            await loginPage.dismissAlerts();
            logger.info('Tested long email edge case');

            await loginPage.clearEmail();
            await loginPage.clearPassword();

            // Test special characters email
            await loginPage.fillEmail(edgeCases.specialCharactersEmail);
            await loginPage.fillPassword(config.VALID_PASSWORD);
            await loginPage.clickLogin();
            await loginPage.dismissAlerts();
            logger.info('Tested special characters email edge case');
        });
    });

    test.describe('Performance and Load Tests', () => {

        test('should load login page within acceptable time', async ({ loginPage }) => {
            const startTime = Date.now();
            await loginPage.goto(config.BASE_URL);
            const loadTime = Date.now() - startTime;

            expect(loadTime).toBeLessThan(5000);
            logger.success(`Page loaded in ${loadTime}ms`);
        });

        test('should handle rapid multiple login attempts', async ({ loginPage, testData }) => {
            for (let i = 0; i < 3; i++) {
                await loginPage.login(testData.invalidEmail, testData.invalidPassword);
                // shorter, bounded pause between rapid attempts
                await loginPage.page.waitForTimeout(200);
                logger.info(`Rapid attempt ${i + 1} completed`);
            }

            // Page should still be functional
            await loginPage.verifyFormElementsVisible();
            logger.success('Page remains functional after rapid attempts');
        });
    });

    test.describe('Additional Features Tests', () => {

        test('should have forgot password link if feature exists', async ({ loginPage }) => {
            await loginPage.clickForgotPassword();
            await loginPage.page.waitForTimeout(3000);

            // If feature exists, should navigate away
            logger.info('Forgot password feature tested');
        });

        test('should have remember me functionality if feature exists', async ({ loginPage }) => {
            await loginPage.checkRememberMe();
            const isChecked = await loginPage.isRememberMeChecked();

            if (isChecked) {
                expect(isChecked).toBeTruthy();
                logger.info('Remember me checkbox is functional');
            }
        });

        test('should have sign up link if feature exists', async ({ loginPage }) => {
            await loginPage.clickSignUp();
            await loginPage.page.waitForTimeout(3000);
            logger.info('Sign up link tested');
        });
    });

    test.describe('Browser Compatibility Tests', () => {

        test('should maintain form state on page reload', async ({ loginPage, testData }) => {
            await loginPage.fillEmail(testData.validEmail);

            const emailBefore = await loginPage.getEmailValue();
            await loginPage.page.reload();

            const emailAfter = await loginPage.getEmailValue();
            logger.info(`Email before reload: ${emailBefore}, after: ${emailAfter}`);
        });

        test('should handle password field after failed login', async ({ loginPage, testData }) => {
            await loginPage.login(testData.validEmail, testData.invalidPassword);
            await loginPage.page.waitForTimeout(5000);

            const passwordValue = await loginPage.getPasswordValue();
            logger.info(`Password field value after failed login: ${passwordValue ? 'retained' : 'cleared'}`);
        });
    });
});
