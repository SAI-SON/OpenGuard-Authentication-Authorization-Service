/**
 * Token service: OAuth2 JWT validation using jose with remote JWKS.
 *
 * Security guarantees:
 * - Verifies signature against the provider's remote JWKS endpoint.
 * - Validates issuer and audience strictly from environment config.
 * - Validates expiration (exp) and not-before (nbf) claims.
 * - Enforces RS256 algorithm (default Auth0 signing algorithm).
 * - Extracts identity from the verified `sub` claim only.
 * - Never logs raw token strings or private claims.
 * - Handles network failures, malformed tokens, and algorithm mismatches.
 *
 * The JWKS client caches public keys and automatically rotates on 401 responses,
 * reducing latency for subsequent requests.
 */
import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from 'jose';
import type { VerifiedTokenPayload } from '../types/authorization.js';

export class TokenValidationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'TokenValidationError';
  }
}

export interface TokenServiceConfig {
  jwksUri: string;
  issuer: string;
  audience: string;
  algorithms?: string[];
}

export class TokenService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly config: Required<TokenServiceConfig>;

  constructor(config: TokenServiceConfig) {
    this.config = {
      algorithms: ['RS256'],
      ...config,
    };

    this.jwks = createRemoteJWKSet(new URL(config.jwksUri));
  }

  /**
   * Verify an OAuth2 access token and return the verified payload.
   *
   * Throws TokenValidationError for any validation failure.
   * The caller must NOT use the token payload if this method throws.
   */
  async verifyToken(accessToken: string): Promise<VerifiedTokenPayload> {
    if (typeof accessToken !== 'string' || accessToken.trim() === '') {
      throw new TokenValidationError('Access token must be a non-empty string.');
    }

    try {
      const { payload } = await jwtVerify(accessToken, this.jwks, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: this.config.algorithms,
      });

      // The `sub` claim is required to identify the authenticated user
      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new TokenValidationError(
          'Token is missing the required "sub" claim.'
        );
      }

      return payload as VerifiedTokenPayload;
    } catch (err) {
      if (err instanceof TokenValidationError) {
        throw err;
      }

      // Map jose errors to descriptive, non-leaking messages
      if (err instanceof joseErrors.JWTExpired) {
        throw new TokenValidationError('Token has expired.', err);
      }
      if (err instanceof joseErrors.JWTClaimValidationFailed) {
        throw new TokenValidationError(
          'Token claim validation failed (issuer or audience mismatch).',
          err
        );
      }
      if (err instanceof joseErrors.JWSSignatureVerificationFailed) {
        throw new TokenValidationError(
          'Token signature verification failed.',
          err
        );
      }
      if (err instanceof joseErrors.JWSInvalid) {
        throw new TokenValidationError('Token has an invalid format.', err);
      }
      if (err instanceof joseErrors.JWTInvalid) {
        throw new TokenValidationError('Token is malformed.', err);
      }
      if (err instanceof joseErrors.JOSEAlgNotAllowed) {
        throw new TokenValidationError(
          'Token uses an unsupported signing algorithm.',
          err
        );
      }
      if (err instanceof joseErrors.JOSEError) {
        // Covers JWKS network failures and other jose errors
        throw new TokenValidationError(
          'Token validation failed due to a configuration or network error.',
          err
        );
      }

      // Unknown error — re-wrap without exposing internals
      throw new TokenValidationError(
        'An unexpected error occurred during token validation.',
        err
      );
    }
  }
}

/** Build a TokenService from environment configuration */
export function createTokenService(
  domain: string,
  audience: string,
  issuer: string
): TokenService {
  const jwksUri = `https://${domain}/.well-known/jwks.json`;
  return new TokenService({ jwksUri, issuer, audience });
}
