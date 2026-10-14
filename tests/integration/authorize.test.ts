/**
 * Integration tests: POST /authorize endpoint
 *
 * Tests the full request/response cycle including:
 * - JWT verification (using isolated test keys)
 * - Permission database lookups (in-memory SQLite)
 * - Authorization decisions for all sample scenarios
 * - Error handling (400, 401, 404, 500)
 *
 * No live Auth0 account or external network connections are required.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { TokenService } from '../../src/services/token.service.js';
import { AuthorizationService } from '../../src/services/authorization.service.js';
import { PermissionRepository } from '../../src/repositories/permission.repository.js';
import { initializeDatabase, closeDatabase } from '../../src/config/database.js';
import {
  startJwksServer,
  generateTestToken,
  type JwksServer,
} from '../helpers/jwt-test-helper.js';

const TEST_ISSUER = 'https://test.example.com/';
const TEST_AUDIENCE = 'https://test-api';

let app: Express;
let repo: PermissionRepository;
let jwksServer: JwksServer;

// ── Test fixtures ─────────────────────────────────────────────────────────────

async function buildApp(): Promise<void> {
  jwksServer = await startJwksServer();

  const db = initializeDatabase(':memory:');
  repo = new PermissionRepository(db);

  const tokenService = new TokenService({
    jwksUri: jwksServer.url,
    issuer: TEST_ISSUER,
    audience: TEST_AUDIENCE,
  });
  const authorizationService = new AuthorizationService(repo);

  app = createApp({
    tokenService,
    authorizationService,
    rateLimitMax: 10000, // high limit so tests don't hit it
  });
}

function seedData(): void {
  repo.deleteAll();

  // user123
  repo.insert('user123', 'read',   'transactions',  'allow');
  repo.insert('user123', 'write',  'transactions',  'allow');
  repo.insert('user123', 'delete', 'transactions',  'deny');
  repo.insert('user123', 'read',   'accounts',      'allow');

  // user456
  repo.insert('user456', 'read',  'wallets/*',                      'allow');
  repo.insert('user456', 'write', 'wallets/wallet-789',              'allow');
  repo.insert('user456', 'read',  'wallets/wallet-789/transactions', 'allow');

  // user789
  repo.insert('user789', 'write', 'wallets/*/transactions',   'allow');
  repo.insert('user789', 'write', 'wallets/*/transactions/*', 'allow');

  // admin789
  repo.insert('admin789', 'read',   '*', 'allow');
  repo.insert('admin789', 'write',  '*', 'allow');
  repo.insert('admin789', 'delete', '*', 'allow');
}

beforeAll(async () => {
  await buildApp();
});

beforeEach(() => {
  seedData();
});

afterAll(async () => {
  closeDatabase();
  await jwksServer.close();
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function authorizeAs(
  userId: string,
  method: string,
  path: string
): Promise<request.Response> {
  const token = await generateTestToken({ sub: userId });
  return request(app)
    .post('/authorize')
    .send({ access_token: token, method, path })
    .set('Content-Type', 'application/json');
}

// ── Sample scenario tests ─────────────────────────────────────────────────────

describe('POST /authorize — required sample scenarios', () => {
  it('user123 can read transactions (GET /transactions → ALLOW)', async () => {
    const res = await authorizeAs('user123', 'GET', '/transactions');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('ALLOW');
    expect(res.body.user_id).toBe('user123');
    expect(res.body.matched_permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'read', resource: 'transactions', effect: 'allow' }),
      ])
    );
  });

  it('user123 cannot delete transactions (DELETE /transactions/txn-456 → DENY)', async () => {
    const res = await authorizeAs('user123', 'DELETE', '/transactions/txn-456');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('DENY');
    expect(res.body.user_id).toBe('user123');
  });

  it('user456 can read wallet transactions (GET /wallets/wallet-789/transactions → ALLOW)', async () => {
    const res = await authorizeAs('user456', 'GET', '/wallets/wallet-789/transactions');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('ALLOW');
    expect(res.body.user_id).toBe('user456');
  });

  it('user789 can write a nested wallet transaction (POST /wallets/wallet-456/transactions/txn-999 → ALLOW)', async () => {
    const res = await authorizeAs('user789', 'POST', '/wallets/wallet-456/transactions/txn-999');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('ALLOW');
    expect(res.body.user_id).toBe('user789');
  });

  it('user789 can write wallet transactions collection (POST /wallets/wallet-789/transactions → ALLOW)', async () => {
    const res = await authorizeAs('user789', 'POST', '/wallets/wallet-789/transactions');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('ALLOW');
    expect(res.body.user_id).toBe('user789');
  });

  it('user456 cannot write wallet transactions (POST /wallets/wallet-789/transactions → DENY)', async () => {
    // Critical conflict test: user456 has write on wallets/wallet-789 (2-segment)
    // but NOT on wallets/wallet-789/transactions (3-segment) due to no parent inheritance
    const res = await authorizeAs('user456', 'POST', '/wallets/wallet-789/transactions');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('DENY');
    expect(res.body.user_id).toBe('user456');
  });

  it('admin789 has global delete permission (DELETE /accounts/acc-123/settings → ALLOW)', async () => {
    const res = await authorizeAs('admin789', 'DELETE', '/accounts/acc-123/settings');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('ALLOW');
    expect(res.body.user_id).toBe('admin789');
  });

  it('unknown user has no permission (GET /transactions → DENY)', async () => {
    const res = await authorizeAs('unknown-user-xyz', 'GET', '/transactions');
    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('DENY');
    expect(res.body.matched_permissions).toHaveLength(0);
  });
});

// ── Authentication error scenarios ────────────────────────────────────────────

describe('POST /authorize — authentication errors (HTTP 401)', () => {
  it('rejects an invalid/malformed token', async () => {
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: 'not-a-valid-jwt', method: 'GET', path: '/transactions' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AUTHENTICATION_ERROR');
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await generateTestToken({
      sub: 'user123',
      exp: now - 3600,
      iat: now - 7200,
    });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET', path: '/transactions' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AUTHENTICATION_ERROR');
  });

  it('rejects a token with wrong audience', async () => {
    const token = await generateTestToken({
      sub: 'user123',
      aud: 'https://wrong-audience',
    });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET', path: '/transactions' });
    expect(res.status).toBe(401);
  });

  it('rejects a token with wrong issuer', async () => {
    const token = await generateTestToken({
      sub: 'user123',
      iss: 'https://wrong-issuer.example.com/',
    });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET', path: '/transactions' });
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong key (invalid signature)', async () => {
    const token = await generateTestToken({
      sub: 'user123',
      useWrongKey: true,
    });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET', path: '/transactions' });
    expect(res.status).toBe(401);
  });
});

// ── Validation error scenarios ─────────────────────────────────────────────────

describe('POST /authorize — validation errors (HTTP 400)', () => {
  it('rejects missing access_token', async () => {
    const res = await request(app)
      .post('/authorize')
      .send({ method: 'GET', path: '/transactions' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing method', async () => {
    const token = await generateTestToken({ sub: 'user123' });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, path: '/transactions' });
    expect(res.status).toBe(400);
  });

  it('rejects missing path', async () => {
    const token = await generateTestToken({ sub: 'user123' });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET' });
    expect(res.status).toBe(400);
  });

  it('rejects unsupported HTTP method (OPTIONS)', async () => {
    const token = await generateTestToken({ sub: 'user123' });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'OPTIONS', path: '/transactions' });
    expect(res.status).toBe(400);
  });

  it('rejects empty access_token', async () => {
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: '', method: 'GET', path: '/transactions' });
    expect(res.status).toBe(400);
  });

  it('rejects path without leading slash', async () => {
    const token = await generateTestToken({ sub: 'user123' });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET', path: 'transactions' });
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON body', async () => {
    const res = await request(app)
      .post('/authorize')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    expect(res.status).toBe(400);
  });

  it('rejects empty body', async () => {
    const res = await request(app)
      .post('/authorize')
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── Response structure tests ──────────────────────────────────────────────────

describe('POST /authorize — response structure', () => {
  it('ALLOW response has correct structure', async () => {
    const res = await authorizeAs('user123', 'GET', '/transactions');
    expect(res.body).toMatchObject({
      decision: 'ALLOW',
      user_id: 'user123',
      reason: expect.any(String),
      matched_permissions: expect.arrayContaining([
        expect.objectContaining({
          action: expect.any(String),
          resource: expect.any(String),
          effect: expect.stringMatching(/^(allow|deny)$/),
        }),
      ]),
    });
  });

  it('DENY response has correct structure', async () => {
    const res = await authorizeAs('unknown-user', 'GET', '/transactions');
    expect(res.body).toMatchObject({
      decision: 'DENY',
      user_id: 'unknown-user',
      reason: expect.any(String),
      matched_permissions: [],
    });
  });

  it('response does not contain access token', async () => {
    const token = await generateTestToken({ sub: 'user123' });
    const res = await request(app)
      .post('/authorize')
      .send({ access_token: token, method: 'GET', path: '/transactions' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain(token);
  });

  it('response does not contain stack traces in errors', async () => {
    const res = await request(app)
      .post('/authorize')
      .send({ method: 'GET', path: '/transactions' }); // missing token
    expect(res.body).not.toHaveProperty('stack');
  });
});

// ── Health check ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ── Documentation endpoint ─────────────────────────────────────────────────────

describe('GET /docs', () => {
  it('returns 200 with API documentation', async () => {
    const res = await request(app).get('/docs');
    expect(res.status).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(res.body.endpoints).toBeDefined();
  });
});

// ── 404 fallback ──────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for unknown GET route', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('returns 404 for GET /authorize (wrong method)', async () => {
    const res = await request(app).get('/authorize');
    expect(res.status).toBe(404);
  });
});

// ── Specificity and conflict resolution (integration) ─────────────────────────

describe('POST /authorize — specificity and conflict resolution', () => {
  it('more-specific rule overrides global wildcard', async () => {
    repo.deleteAll();
    repo.insert('testuser', 'read', '*', 'allow');
    repo.insert('testuser', 'read', 'transactions', 'deny');

    const res = await authorizeAs('testuser', 'GET', '/transactions');
    expect(res.body.decision).toBe('DENY');
    expect(res.body.matched_permissions[0]?.resource).toBe('transactions');
  });

  it('equal-specificity deny beats allow', async () => {
    repo.deleteAll();
    repo.insert('testuser', 'read', 'transactions', 'allow');
    repo.insert('testuser', 'read', 'transactions', 'deny');

    const res = await authorizeAs('testuser', 'GET', '/transactions');
    expect(res.body.decision).toBe('DENY');
  });

  it('exact match beats wildcard', async () => {
    repo.deleteAll();
    repo.insert('testuser', 'read', 'wallets/*', 'deny');
    repo.insert('testuser', 'read', 'wallets/wallet-789', 'allow');

    const res = await authorizeAs('testuser', 'GET', '/wallets/wallet-789');
    expect(res.body.decision).toBe('ALLOW');
    expect(res.body.matched_permissions[0]?.resource).toBe('wallets/wallet-789');
  });
});
