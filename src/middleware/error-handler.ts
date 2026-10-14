/**
 * Centralized error handling middleware.
 *
 * - Converts known error types to structured JSON responses.
 * - Never exposes stack traces in production.
 * - Never echoes back access tokens or other sensitive values.
 */
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ValidationError } from '../schemas/authorize.schema.js';
import { TokenValidationError } from '../services/token.service.js';

interface ErrorResponse {
  error: string;
  message: string;
  field?: string;
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isProd = process.env['NODE_ENV'] === 'production';

  if (err instanceof ValidationError) {
    const body: ErrorResponse = {
      error: 'VALIDATION_ERROR',
      message: err.message,
    };
    if (err.field) body.field = err.field;
    res.status(400).json(body);
    return;
  }

  if (err instanceof TokenValidationError) {
    res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: err.message,
    });
    return;
  }

  // SyntaxError from express.json() for malformed JSON
  if (err instanceof SyntaxError && 'status' in err) {
    res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Request body contains invalid JSON.',
    });
    return;
  }

  // Generic server error
  console.error('[ErrorHandler] Unhandled error:', isProd ? '(details suppressed in production)' : err);

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isProd
      ? 'An internal server error occurred.'
      : (err instanceof Error ? err.message : String(err)),
  });
};

/** Handle requests to unknown routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} does not exist.`,
  });
}
