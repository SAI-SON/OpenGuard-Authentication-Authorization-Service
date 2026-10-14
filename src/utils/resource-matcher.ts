/**
 * Resource normalization and wildcard matching.
 *
 * ## Resource Representation
 * - API paths are normalized to canonical resource strings by stripping the
 *   leading slash: /wallets/wallet-789/transactions becomes wallets/wallet-789/transactions
 * - Resources in the database may be exact strings or contain wildcards:
 *     - * (star)               - matches anything (global wildcard, 0 specificity)
 *     - wallets/*              - matches any single segment under wallets
 *     - wallets/*-transactions-star - multi-level pattern with two wildcards
 *
 * ## Wildcard Semantics
 * - `*` in a resource pattern matches exactly ONE path segment.
 * - A bare `*` (the only segment) matches any resource regardless of depth.
 * - Matching is always segment-based, never substring-based.
 *
 * ## Specificity
 * Specificity is the primary ordering criterion when multiple patterns match:
 * - Counted as: (number of literal segments) * 1000 - (number of wildcard segments)
 * - A higher score means more specific.
 * - A bare global `*` has the lowest possible specificity.
 *
 * ## Parent Inheritance Policy
 * Permissions are NOT inherited by descendant resources by default.
 * A permission on `wallets/wallet-789` does NOT automatically grant access to
 * `wallets/wallet-789/transactions`. Only database patterns that explicitly
 * match the requested resource (including via wildcards) are considered.
 * This prevents accidental privilege escalation through broad resource grants.
 */

/**
 * Normalize an API path to a canonical resource string.
 * Removes leading slash, collapses double slashes, and lowercases.
 * Throws if the path contains traversal sequences (..) or is empty.
 */
export function normalizePath(apiPath: string): string {
  if (typeof apiPath !== 'string' || apiPath.trim() === '') {
    throw new Error('Path must be a non-empty string.');
  }

  // Reject path traversal attempts
  if (apiPath.includes('..')) {
    throw new Error('Path must not contain ".." segments.');
  }

  // Strip leading slash, collapse consecutive slashes, trim whitespace
  const normalized = apiPath
    .trim()
    .replace(/^\/+/, '')          // remove leading slashes
    .replace(/\/+$/, '')          // remove trailing slashes
    .replace(/\/{2,}/g, '/');     // collapse consecutive slashes

  if (normalized === '') {
    throw new Error('Path resolves to an empty resource string.');
  }

  // Only allow safe characters: alphanumeric, hyphen, underscore, slash, dot
  if (!/^[a-zA-Z0-9\-_./]+$/.test(normalized)) {
    throw new Error(
      `Path contains invalid characters: "${normalized}". ` +
      'Only alphanumeric, hyphen, underscore, slash, and dot are allowed.'
    );
  }

  return normalized;
}

/**
 * Compute the specificity score of a resource pattern.
 *
 * Higher score = more specific:
 * - Each literal segment contributes +1000
 * - Each wildcard segment contributes -1
 * - A bare global `*` returns 0
 */
export function computeSpecificity(pattern: string): number {
  if (pattern === '*') return 0;

  const segments = pattern.split('/');
  let score = 0;
  for (const seg of segments) {
    if (seg === '*') {
      score -= 1;
    } else {
      score += 1000;
    }
  }
  return score;
}

/**
 * Test whether a resource pattern matches the requested resource.
 *
 * Rules:
 * - Bare `*` matches any resource, regardless of depth.
 * - Otherwise the pattern and resource must have the same number of segments,
 *   and each pattern segment must either be `*` or equal the resource segment.
 */
export function matchesResource(pattern: string, resource: string): boolean {
  // Global wildcard matches everything
  if (pattern === '*') return true;

  const patternSegments = pattern.split('/');
  const resourceSegments = resource.split('/');

  // Length must match for non-global patterns
  if (patternSegments.length !== resourceSegments.length) return false;

  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const r = resourceSegments[i];
    if (p !== '*' && p !== r) return false;
  }

  return true;
}
