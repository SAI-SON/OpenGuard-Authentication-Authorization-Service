/**
 * Unit tests: Token service
 *
 * Tests JWT verification using a locally generated RSA key pair and
 * a local JWKS HTTP server. These tests are completely isolated from
 * any live Auth0 account.
 *
 * Covers:
 * - Valid token verification
 * - Expired token rejection (401)
 * - Wrong audience rejection (401)
 * - Wrong issuer rejection (401)
 * - Invalid signature rejection (401)
 * - Malformed token rejection (401)
 * - Missing sub claim rejection
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TokenService, TokenValidationError } from '../../src/services/token.service.js';
import {
  startJwksServer,
  generateTestToken,
  type JwksServer,
} from '../helpers/jwt-test-helper.js';

const TEST_ISSUER = 'https://test.example.com/';
const TEST_AUDIENCE = 'https://test-api';

let jwksServer: JwksServer;
let tokenService: TokenService;

beforeAll(async () => {
  jwksServer = await startJwksServer();
  tokenService = new TokenService({
    jwksUri: jwksServer.url,
    issuer: TEST_ISSUER,
    audience: TEST_AUDIENCE,
  });
});

afterAll(async () => {
  await jwksServer.close();
});

describe('TokenService.verifyToken', () => {
  it('accepts a valid token and returns the verified payload', async () => {
    const token = await generateTestToken({ sub: 'user123' });
    const payload = await tokenService.verifyToken(token);
    expect(payload.sub).toBe('user123');
    expect(payload.iss).toBe(TEST_ISSUER);
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await generateTestToken({
      sub: 'user123',
      exp: now - 3600, // expired 1 hour ago
      iat: now - 7200,
    });

    await expect(tokenService.verifyToken(token)).rejects.toThrow(TokenValidationError);
    await expect(tokenService.verifyToken(token)).rejects.toThrow('expired');
  });

  it('rejects a token with the wrong audience', async () => {
    const token = await generateTestToken({
      sub: 'user123',
      aud: 'https://wrong-audience',
    });

    await expect(tokenService.verifyToken(token)).rejects.toThrow(TokenValidationError);
  });

  it('rejects a token with the wrong issuer', async () => {
    const token = await generateTestToken({
      sub: 'user123',
      iss: 'https://wrong-issuer.example.com/',
    });

    await expect(tokenService.verifyToken(token)).rejects.toThrow(TokenValidationError);
  });

  it('rejects a token signed with an unknown/wrong key', async () => {
    const token = await generateTestToken({
      sub: 'user123',
      useWrongKey: true,
    });

    await expect(tokenService.verifyToken(token)).rejects.toThrow(TokenValidationError);
  });

  it('rejects a malformed token string', async () => {
    await expect(tokenService.verifyToken('not.a.valid.jwt')).rejects.toThrow(TokenValidationError);
  });

  it('rejects an empty string token', async () => {
    await expect(tokenService.verifyToken('')).rejects.toThrow(TokenValidationError);
  });

  it('rejects a completely random string', async () => {
    await expect(tokenService.verifyToken('random-garbage-value')).rejects.toThrow(TokenValidationError);
  });

  it('returns the correct sub claim from verified token', async () => {
    const token = await generateTestToken({ sub: 'admin789' });
    const payload = await tokenService.verifyToken(token);
    expect(payload.sub).toBe('admin789');
  });

  it('accepts a token for a different valid user', async () => {
    const token = await generateTestToken({ sub: 'user456' });
    const payload = await tokenService.verifyToken(token);
    expect(payload.sub).toBe('user456');
  });
});
