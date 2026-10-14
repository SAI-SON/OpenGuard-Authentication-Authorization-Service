/**
 * Global test setup: configure NODE_ENV=test so that config/env.ts
 * uses safe placeholder defaults instead of requiring live Auth0 config.
 */
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_PATH'] = ':memory:';
process.env['AUTH0_DOMAIN'] = 'test.example.com';
process.env['AUTH0_API_AUDIENCE'] = 'https://test-api';
process.env['AUTH0_ISSUER'] = 'https://test.example.com/';
