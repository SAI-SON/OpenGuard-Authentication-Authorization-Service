/**
 * Environment configuration validation.
 *
 * Validates all required environment variables at startup and
 * provides strongly-typed access to configuration values.
 */
import dotenv from 'dotenv';

// Load .env file in non-production environments
if (process.env['NODE_ENV'] !== 'production') {
  dotenv.config();
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Copy .env.example to .env and provide a value.`
    );
  }
  return value.trim();
}

function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  return value.trim();
}

export interface EnvConfig {
  /** Auth0 domain, e.g. your-tenant.us.auth0.com */
  AUTH0_DOMAIN: string;
  /** Auth0 API audience identifier */
  AUTH0_API_AUDIENCE: string;
  /** JWT issuer URL, e.g. https://your-tenant.us.auth0.com/ */
  AUTH0_ISSUER: string;
  /** HTTP port to listen on */
  PORT: number;
  /** Absolute or relative path to the SQLite database file */
  DATABASE_PATH: string;
  /** Node environment (development | production | test) */
  NODE_ENV: string;
  /** Whether we are running in a test environment */
  IS_TEST: boolean;
}

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (_config) return _config;

  const nodeEnv = optionalEnv('NODE_ENV', 'development');
  const isTest = nodeEnv === 'test';

  // In test mode, many auth values will be overridden per-test,
  // so we use safe placeholder defaults to allow the module to load.
  _config = {
    AUTH0_DOMAIN: isTest
      ? optionalEnv('AUTH0_DOMAIN', 'test.example.com')
      : requireEnv('AUTH0_DOMAIN'),
    AUTH0_API_AUDIENCE: isTest
      ? optionalEnv('AUTH0_API_AUDIENCE', 'https://test-api')
      : requireEnv('AUTH0_API_AUDIENCE'),
    AUTH0_ISSUER: isTest
      ? optionalEnv('AUTH0_ISSUER', 'https://test.example.com/')
      : requireEnv('AUTH0_ISSUER'),
    PORT: parseInt(optionalEnv('PORT', '3000'), 10),
    DATABASE_PATH: optionalEnv('DATABASE_PATH', './data/permissions.db'),
    NODE_ENV: nodeEnv,
    IS_TEST: isTest,
  };

  return _config;
}

/** Reset cached config (used in tests to isolate environments) */
export function resetConfig(): void {
  _config = null;
}
