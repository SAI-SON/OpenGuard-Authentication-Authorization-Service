/**
 * Unit tests: Request body validation schema
 */
import { describe, it, expect } from 'vitest';
import { validateAuthorizeRequest, ValidationError } from '../../src/schemas/authorize.schema.js';

describe('validateAuthorizeRequest', () => {
  const validBody = {
    access_token: 'valid.token.here',
    method: 'GET',
    path: '/transactions',
  };

  it('accepts a valid request body', () => {
    const result = validateAuthorizeRequest(validBody);
    expect(result.access_token).toBe('valid.token.here');
    expect(result.method).toBe('GET');
    expect(result.path).toBe('/transactions');
  });

  it('normalizes method to uppercase', () => {
    const result = validateAuthorizeRequest({ ...validBody, method: 'get' });
    expect(result.method).toBe('GET');
  });

  it('accepts all supported HTTP methods', () => {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const result = validateAuthorizeRequest({ ...validBody, method });
      expect(result.method).toBe(method);
    }
  });

  it('rejects null body', () => {
    expect(() => validateAuthorizeRequest(null)).toThrow(ValidationError);
  });

  it('rejects array body', () => {
    expect(() => validateAuthorizeRequest([])).toThrow(ValidationError);
  });

  it('rejects missing access_token', () => {
    const { access_token: _, ...body } = validBody;
    void _;
    expect(() => validateAuthorizeRequest(body)).toThrow(ValidationError);
  });

  it('rejects empty access_token', () => {
    expect(() => validateAuthorizeRequest({ ...validBody, access_token: '' }))
      .toThrow(ValidationError);
  });

  it('rejects missing method', () => {
    const { method: _, ...body } = validBody;
    void _;
    expect(() => validateAuthorizeRequest(body)).toThrow(ValidationError);
  });

  it('rejects unsupported method (OPTIONS)', () => {
    expect(() => validateAuthorizeRequest({ ...validBody, method: 'OPTIONS' }))
      .toThrow(ValidationError);
  });

  it('rejects missing path', () => {
    const { path: _, ...body } = validBody;
    void _;
    expect(() => validateAuthorizeRequest(body)).toThrow(ValidationError);
  });

  it('rejects empty path', () => {
    expect(() => validateAuthorizeRequest({ ...validBody, path: '' }))
      .toThrow(ValidationError);
  });

  it('rejects path without leading slash', () => {
    expect(() => validateAuthorizeRequest({ ...validBody, path: 'transactions' }))
      .toThrow(ValidationError);
  });

  it('rejects non-string access_token', () => {
    expect(() => validateAuthorizeRequest({ ...validBody, access_token: 123 }))
      .toThrow(ValidationError);
  });

  it('rejects non-string method', () => {
    expect(() => validateAuthorizeRequest({ ...validBody, method: 42 }))
      .toThrow(ValidationError);
  });
});
