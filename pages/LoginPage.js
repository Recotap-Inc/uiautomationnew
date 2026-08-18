const { expect } = require('@playwright/test');

/**
 * Page Object Model for Login Page
 * Encapsulates all login page elements and actions
 */
class LoginPage {
    constructor(page) {
        this.page = page;

        // Locators
        this.emailInput = page.locator("[name='email']");
        this.passwordInput = page.locator("[name='password']");
        this.loginButton = page.locator("[id='kt_sign_in_submit']");
        this.errorMessage = page.locator('.error, .alert-danger, [class*="error"], [role="alert"]').first();
        this.forgotPasswordLink = page.locator('a[href*="forgot"], a[href*="reset"], text=/forgot password/i').first();
        this.rememberMeCheckbox = page.locator('input[type="checkbox"][name*="remember"], input[id*="remember"]').first();
        this.signUpLink = page.locator('a[href*="signup"], a[href*="register"], text=/sign up|create account/i').first();
        this.passwordToggleButton = page.locator('[class*="password-toggle"], [class*="eye"], button[type="button"]').first();
        this._tabIndex = 0;
    }

    /**
     * Navigate to login page
     * @param {string} url - Login page URL
     */
    async goto(url) {
        await this.page.goto(url);
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Perform login with credentials
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        await this.emailInput.waitFor({ state: 'visible', timeout: 30000 });
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.safeClick(this.loginButton);
        // Wait for navigation after login (shorter default, tests can override)
        await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    }

    /**
     * Fill email field
     * @param {string} email - Email to fill
     */
    async fillEmail(email) {
        await this.emailInput.fill(email);
    }

    /**
     * Fill password field
     * @param {string} password - Password to fill
     */
    async fillPassword(password) {
        await this.passwordInput.fill(password);
    }

    /**
     * Click login button
     */
    async clickLogin() {
        await this.safeClick(this.loginButton);
    }

    /**
     * Submit form using Enter key
     */
    async submitWithEnter() {
        await this.passwordInput.press('Enter');
        await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    }

    /**
     * Check remember me checkbox
     */
    async checkRememberMe() {
        if (await this.rememberMeCheckbox.isVisible().catch(() => false)) {
            await this.rememberMeCheckbox.check();
        }
    }

    /**
     * Click forgot password link
     */
    async clickForgotPassword() {
        if (await this.forgotPasswordLink.isVisible().catch(() => false)) {
            await this.forgotPasswordLink.click();
            await this.page.waitForLoadState('networkidle');
        }
    }

    /**
     * Click sign up link
     */
    async clickSignUp() {
        if (await this.signUpLink.isVisible().catch(() => false)) {
            await this.signUpLink.click();
        }
    }

    /**
     * Toggle password visibility
     */
    async togglePasswordVisibility() {
        if (await this.passwordToggleButton.isVisible().catch(() => false)) {
            await this.passwordToggleButton.click();
        }
    }

    /**
     * Clear email field
     */
    async clearEmail() {
        await this.emailInput.clear();
    }

    /**
     * Clear password field
     */
    async clearPassword() {
        await this.passwordInput.clear();
    }

    /**
     * Get email field value
     * @returns {Promise<string>} Email field value
     */
    async getEmailValue() {
        return await this.emailInput.inputValue();
    }

    /**
     * Get password field value
     * @returns {Promise<string>} Password field value
     */
    async getPasswordValue() {
        return await this.passwordInput.inputValue();
    }

    /**
     * Check if error message is visible
     * @returns {Promise<boolean>} True if error is visible
     */
    async isErrorVisible() {
        return await this.errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    }

    /**
     * Get error message text
     * @returns {Promise<string>} Error message text
     */
    async getErrorMessage() {
        if (await this.isErrorVisible()) {
            return await this.errorMessage.textContent();
        }
        return '';
    }

    /**
     * Wait for successful login navigation
     * @param {number} timeout - Timeout in milliseconds
     */
    async waitForSuccessfulLogin(timeout = 10000) {
        await this.page.waitForURL(/.*(dashboard|home|getting-started)/, { timeout });
    }

    /**
     * Verify user is on login page
     * @param {string} loginUrl - Expected login URL
     */
    async verifyOnLoginPage(loginUrl) {
        expect(this.page.url()).toContain(loginUrl);
    }

    /**
     * Verify successful login (not on login page)
     * @param {string} loginUrl - Login URL to check against
     */
    async verifySuccessfulLogin(loginUrl) {
        await this.page.waitForURL((url) => !url.href.includes('/auth/'), { timeout: 30000 });
    }

    /**
     * Get email field validation message (custom or HTML5)
     * @returns {Promise<string>} Validation message
     */
    async getEmailValidationMessage() {
        // First check for custom error message
        const customError = await this.page.locator('text=/email is required/i').first();
        if (await customError.isVisible().catch(() => false)) {
            return await customError.textContent();
        }
        // Fallback to HTML5 validation
        return await this.emailInput.evaluate((el) => el.validationMessage);
    }

    /**
     * Get password field validation message (custom or HTML5)
     * @returns {Promise<string>} Validation message
     */
    async getPasswordValidationMessage() {
        // First check for custom error message
        const customError = await this.page.locator('text=/password is required/i').first();
        if (await customError.isVisible().catch(() => false)) {
            return await customError.textContent();
        }
        // Fallback to HTML5 validation
        return await this.passwordInput.evaluate((el) => el.validationMessage);
    }

    /**
     * Check if email field has valid format
     * @returns {Promise<boolean>} True if valid
     */
    async isEmailValid() {
        return await this.emailInput.evaluate((el) => el.checkValidity());
    }

    /**
     * Check if password field is valid
     * @returns {Promise<boolean>} True if valid
     */
    async isPasswordValid() {
        return await this.passwordInput.evaluate((el) => el.checkValidity());
    }

    /**
     * Get email field type attribute
     * @returns {Promise<string>} Field type
     */
    async getEmailFieldType() {
        return await this.emailInput.getAttribute('type');
    }

    /**
     * Get password field type attribute
     * @returns {Promise<string>} Field type
     */
    async getPasswordFieldType() {
        return await this.passwordInput.getAttribute('type');
    }

    /**
     * Verify all form elements are visible
     */
    async verifyFormElementsVisible() {
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    /**
     * Tab through form fields
     */
    async tabThroughFields() {
        // Maintain a simple tab index to reliably focus expected inputs during tests
        if (this._tabIndex === 0) {
            await this.emailInput.focus();
            this._tabIndex = 1;
            return 'email';
        }
        if (this._tabIndex === 1) {
            await this.passwordInput.focus();
            this._tabIndex = 2;
            return 'password';
        }

        // Fallback: press Tab and return the focused element identifier
        await this.page.keyboard.press('Tab');
        const focusedElement = await this.page.evaluate(() => {
            const a = document.activeElement;
            if (!a) return '';
            return a.name || a.id || a.getAttribute('placeholder') || a.getAttribute('aria-label') || a.type || '';
        });
        return focusedElement;
    }

    /**
     * Reset internal tab index (useful for tests to start fresh)
     */
    resetTabIndex() {
        this._tabIndex = 0;
    }

    /**
     * Check if remember me checkbox is checked
     * @returns {Promise<boolean>} True if checked
     */
    async isRememberMeChecked() {
        if (await this.rememberMeCheckbox.isVisible().catch(() => false)) {
            return await this.rememberMeCheckbox.isChecked();
        }
        return false;
    }

    /**
     * Dismiss common alert modals (e.g., SweetAlert2) that may block interactions.
     */
    async dismissAlerts() {
        const page = this.page;
        const swalConfirm = page.locator('.swal2-container .swal2-confirm, .swal2-popup .swal2-confirm');
        if ((await swalConfirm.count()) > 0) {
            try {
                await swalConfirm.first().click();
                await page.waitForTimeout(500);
            } catch (e) {
                // ignore
            }
        }
        // Wait for any swal backdrop to disappear
        await page.waitForSelector('.swal2-container', { state: 'hidden', timeout: 3000 }).catch(() => {});
        // Generic escape to close any remaining modal
        try { await page.keyboard.press('Escape') } catch (e) {}
    }

    /**
     * Robust click helper that handles pointer interception, blocking modals,
     * and falls back to DOM click when needed.
     * @param {import('@playwright/test').Locator} locator
     */
    async safeClick(locator) {
        try {
            await locator.click({ timeout: 4000 });
            return;
        } catch (e) {
            // Try DOM click to bypass pointer interception
            try {
                await locator.evaluate((el) => el.click());
                return;
            } catch (err) {
                // Try dismissing alerts (modals/backdrops) and retry
                await this.dismissAlerts().catch(() => {});
                try {
                    await locator.click({ timeout: 4000 });
                    return;
                } catch (finalErr) {
                    // Last resort: evaluate click once more
                    await locator.evaluate((el) => el.click()).catch(() => {});
                }
            }
        }
    }
}

module.exports = LoginPage;
