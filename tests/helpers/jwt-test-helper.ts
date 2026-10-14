/**
 * Test JWT helper: generates real signed JWTs using locally generated RSA keys.
 *
 * This helper is ONLY for tests. It creates an isolated RSA key pair and
 * provides a mock JWKS endpoint (via a lightweight HTTP server) so that
 * the TokenService can verify tokens without any real Auth0 account.
 *
 * Design:
 * - Generates an RSA-2048 key pair at test initialization.
 * - Exposes the public key via a local HTTP server on a random port.
 * - The TokenService is configured to point to this local JWKS endpoint.
 * - All tokens signed with this test private key will pass validation.
 * - Expired/wrong-audience/wrong-issuer tokens can be generated for negative tests.
 */
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import type { KeyLike } from 'jose';
import http from 'http';
import type { AddressInfo } from 'net';

export interface TestKeySet {
  privateKey: KeyLike;
  publicKey: KeyLike;
  kid: string;
}

export interface JwksServer {
  url: string;
  server: http.Server;
  close: () => Promise<void>;
}

export interface TestJwtOptions {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;     // absolute timestamp (seconds)
  nbf?: number;
  iat?: number;
  /** If true, sign with a DIFFERENT key not in the JWKS (invalid signature) */
  useWrongKey?: boolean;
}

const TEST_ISSUER = 'https://test.example.com/';
const TEST_AUDIENCE = 'https://test-api';

let cachedKeySet: TestKeySet | null = null;

/** Generate (and cache) the test RSA key pair */
export async function getTestKeySet(): Promise<TestKeySet> {
  if (cachedKeySet) return cachedKeySet;

  const { privateKey, publicKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  });

  cachedKeySet = { privateKey, publicKey, kid: 'test-key-1' };
  return cachedKeySet;
}

/** Start a local JWKS server and return its URL */
export async function startJwksServer(): Promise<JwksServer> {
  const { publicKey, kid } = await getTestKeySet();
  const jwk = await exportJWK(publicKey);
  const jwks = {
    keys: [{ ...jwk, kid, use: 'sig', alg: 'RS256' }],
  };
  const body = JSON.stringify(jwks);

  const server = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(body);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const { port } = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}/.well-known/jwks.json`;

  return {
    url,
    server,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      ),
  };
}

/** Generate a signed test JWT with the given options */
export async function generateTestToken(opts: TestJwtOptions = {}): Promise<string> {
  const { privateKey, publicKey, kid } = await getTestKeySet();

  const now = Math.floor(Date.now() / 1000);

  const sub = opts.sub ?? 'user123';
  const iss = opts.iss ?? TEST_ISSUER;
  const aud = opts.aud ?? TEST_AUDIENCE;
  const exp = opts.exp ?? now + 3600; // 1 hour from now
  const iat = opts.iat ?? now;

  // Use a wrong key to simulate invalid signature
  let signingKey: KeyLike;
  if (opts.useWrongKey) {
    const { privateKey: wrongKey } = await generateKeyPair('RS256', { modulusLength: 2048 });
    signingKey = wrongKey;
    // Note: this token will fail JWKS verification because it's signed with an unknown key
    void publicKey; // suppress unused warning
  } else {
    signingKey = privateKey;
  }

  const builder = new SignJWT({ sub })
    .setProtectedHeader({ alg: 'RS256', kid: opts.useWrongKey ? 'unknown-key' : kid })
    .setIssuedAt(iat)
    .setIssuer(iss)
    .setExpirationTime(exp);

  if (aud) {
    builder.setAudience(aud);
  }

  return builder.sign(signingKey);
}
