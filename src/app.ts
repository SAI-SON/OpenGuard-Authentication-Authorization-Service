/**
 * Express application factory.
 *
 * Configures:
 * - Helmet security headers
 * - JSON body parsing with size limit
 * - Configurable rate limiting
 * - Health check endpoint
 * - API documentation endpoint
 * - Authorization routes
 * - 404 and centralized error handling
 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { TokenService } from './services/token.service.js';
import type { AuthorizationService } from './services/authorization.service.js';
import { createAuthorizeRouter } from './routes/authorize.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

export interface AppOptions {
  tokenService: TokenService;
  authorizationService: AuthorizationService;
  /** Requests per window for rate limiting (default: 100) */
  rateLimitMax?: number;
  /** Rate limit window in milliseconds (default: 60000) */
  rateLimitWindowMs?: number;
}

export function createApp(options: AppOptions): express.Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── Rate limiting ───────────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: options.rateLimitWindowMs ?? 60_000,
      max: options.rateLimitMax ?? 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    })
  );

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API documentation ───────────────────────────────────────────────────────
  app.get('/docs', (_req, res) => {
    res.json({
      title: 'Open Fabric Authorization API',
      version: '1.0.0',
      description: 'OAuth2 JWT validation and fine-grained permission authorization.',
      endpoints: {
        'POST /authorize': {
          description: 'Evaluate whether a user has permission to perform an action.',
          request: {
            body: {
              access_token: 'string — OAuth2 Bearer access token (JWT)',
              method: 'string — HTTP method: GET | POST | PUT | PATCH | DELETE',
              path: 'string — API resource path starting with /',
            },
          },
          response: {
            decision: '"ALLOW" | "DENY"',
            user_id: 'string — authenticated subject from verified JWT',
            reason: 'string — human-readable explanation',
            matched_permissions: 'array — matching permission records',
          },
          example_request: {
            access_token: '<JWT access token>',
            method: 'GET',
            path: '/transactions',
          },
          example_response: {
            decision: 'ALLOW',
            user_id: 'user123',
            reason: 'Permission granted for user "user123" on "transactions" (action: "read").',
            matched_permissions: [
              { action: 'read', resource: 'transactions', effect: 'allow' },
            ],
          },
        },
        'GET /health': {
          description: 'Service health check.',
        },
        'GET /docs': {
          description: 'This API documentation.',
        },
      },
      method_to_action_mapping: {
        GET: 'read',
        POST: 'write',
        PUT: 'write',
        PATCH: 'write',
        DELETE: 'delete',
      },
    });
  });

  // ── Authorization routes ─────────────────────────────────────────────────────
  app.use(
    createAuthorizeRouter(options.tokenService, options.authorizationService)
  );

  // ── 404 fallback ─────────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Centralized error handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
