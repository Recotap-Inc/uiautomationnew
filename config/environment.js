/**
 * Environment Configuration
 * Manages environment-specific settings
 */

const environments = {
    dev: {
        BASE_URL: 'https://dev.abm.recotap.com/',
        API_URL: 'https://dev-api.recotap.com/',
        VALID_EMAIL: 'divya@recotap.com',
        VALID_PASSWORD: 'Test@123',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3
    },
    staging: {
        BASE_URL: 'https://staging.abm.recotap.com/',
        API_URL: 'https://staging-api.recotap.com/',
        VALID_EMAIL: 'divya@recotap.com',
        VALID_PASSWORD: 'Test@123',
        TIMEOUT: 40000,
        RETRY_ATTEMPTS: 2
    },
    production: {
        BASE_URL: 'https://abm.recotap.com/auth/login',
        API_URL: 'https://api.recotap.com/',
        VALID_EMAIL: 'divya@recotap.com',
        VALID_PASSWORD: 'Test@123',
        TIMEOUT: 40000,
        RETRY_ATTEMPTS: 1
    }
};

// Get environment from process.env or default to 'production'
const currentEnv = process.env.TEST_ENV || 'production';

// Validate environment
if (!environments[currentEnv]) {
    throw new Error(`Invalid environment: ${currentEnv}. Valid options: dev, staging, production`);
}

// Export current environment config
const config = {
    ...environments[currentEnv],
    ENV: currentEnv,
    IS_DEV: currentEnv === 'dev',
    IS_STAGING: currentEnv === 'staging',
    IS_PRODUCTION: currentEnv === 'production'
};

console.log(`🌍 Running tests in ${currentEnv.toUpperCase()} environment`);
console.log(`🔗 Base URL: ${config.BASE_URL}`);

module.exports = config;
