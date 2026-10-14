/**
 * Shared TypeScript types for the authorization service.
 */

/** Supported HTTP methods for authorization checks */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Permission effect stored in the database */
export type PermissionEffect = 'allow' | 'deny';

/** Authorization decision returned by the engine */
export type AuthorizationDecision = 'ALLOW' | 'DENY';

/** A single permission record from the database */
export interface Permission {
  id: number;
  user_id: string;
  action: string;
  resource: string;
  effect: PermissionEffect;
}

/** A matched permission returned in the API response (without id) */
export interface MatchedPermission {
  action: string;
  resource: string;
  effect: PermissionEffect;
}

/** The validated and parsed authorization request */
export interface AuthorizationRequest {
  access_token: string;
  method: HttpMethod;
  path: string;
}

/** The authorization response body */
export interface AuthorizationResponse {
  decision: AuthorizationDecision;
  user_id: string;
  reason: string;
  matched_permissions: MatchedPermission[];
}

/** Verified JWT payload claims */
export interface VerifiedTokenPayload {
  sub: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/** Result of the authorization decision */
export interface AuthorizationResult {
  decision: AuthorizationDecision;
  reason: string;
  matched_permissions: MatchedPermission[];
}
