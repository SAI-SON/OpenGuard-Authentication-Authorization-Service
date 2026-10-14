/**
 * Zod-free request body validation for the /authorize endpoint.
 *
 * Validates and parses the raw request body into a typed AuthorizationRequest.
 * Raises descriptive validation errors for all invalid input cases.
 */
import type { HttpMethod, AuthorizationRequest } from '../types/authorization.js';

const ALLOWED_METHODS: ReadonlySet<string> = new Set([
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE',
]);

/** Maps an HTTP method to the canonical action string */
export const METHOD_TO_ACTION: Readonly<Record<HttpMethod, string>> = {
  GET: 'read',
  POST: 'write',
  PUT: 'write',
  PATCH: 'write',
  DELETE: 'delete',
};

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate and parse a raw request body into an AuthorizationRequest.
 * Throws ValidationError on any invalid input.
 */
export function validateAuthorizeRequest(body: unknown): AuthorizationRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const raw = body as Record<string, unknown>;

  // --- access_token ---
  const token = raw['access_token'];
  if (token === undefined || token === null) {
    throw new ValidationError('access_token is required.', 'access_token');
  }
  if (typeof token !== 'string') {
    throw new ValidationError('access_token must be a string.', 'access_token');
  }
  if (token.trim() === '') {
    throw new ValidationError('access_token must not be empty.', 'access_token');
  }

  // --- method ---
  const method = raw['method'];
  if (method === undefined || method === null) {
    throw new ValidationError('method is required.', 'method');
  }
  if (typeof method !== 'string') {
    throw new ValidationError('method must be a string.', 'method');
  }
  const upperMethod = method.trim().toUpperCase();
  if (!ALLOWED_METHODS.has(upperMethod)) {
    throw new ValidationError(
      `method must be one of: ${[...ALLOWED_METHODS].join(', ')}. Got: "${method}"`,
      'method'
    );
  }

  // --- path ---
  const reqPath = raw['path'];
  if (reqPath === undefined || reqPath === null) {
    throw new ValidationError('path is required.', 'path');
  }
  if (typeof reqPath !== 'string') {
    throw new ValidationError('path must be a string.', 'path');
  }
  if (reqPath.trim() === '') {
    throw new ValidationError('path must not be empty.', 'path');
  }
  // Must start with a slash
  if (!reqPath.trim().startsWith('/')) {
    throw new ValidationError(
      'path must start with a forward slash (/).', 'path'
    );
  }

  return {
    access_token: token.trim(),
    method: upperMethod as HttpMethod,
    path: reqPath.trim(),
  };
}
