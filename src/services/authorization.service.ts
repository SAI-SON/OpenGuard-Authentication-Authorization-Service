/**
 * Authorization service: permission resolution and decision logic.
 *
 * ## Algorithm
 *
 * 1. Normalize the request path to a canonical resource string.
 * 2. Map the HTTP method to an action (read | write | delete).
 * 3. Query the database for all permissions matching (user_id, action).
 * 4. Filter to those whose resource pattern matches the requested resource.
 * 5. Select the most-specific matching rule(s) by specificity score.
 * 6. If no rules match → DENY (default-deny).
 * 7. If any rule at the top specificity is 'deny' → DENY (deny wins on ties).
 * 8. Otherwise → ALLOW.
 *
 * ## Conflict Resolution
 * When allow and deny rules exist at the same specificity level, DENY wins.
 * This implements the principle of least privilege.
 *
 * ## Parent Inheritance
 * NOT implemented. A permission on `wallets/wallet-789` does NOT grant
 * access to `wallets/wallet-789/transactions`. Each resource match requires
 * the database pattern to explicitly match the full requested resource.
 *
 * This resolves the assignment inconsistency:
 * - user456 has write permission on `wallets/wallet-789` (2-segment pattern)
 * - POST /wallets/wallet-789/transactions → resource = `wallets/wallet-789/transactions` (3 segments)
 * - `wallets/wallet-789` (2 segments) does NOT match a 3-segment resource
 * - Therefore user456 is correctly DENIED for POST /wallets/wallet-789/transactions
 *
 * See README.md § "Conflicting Sample Scenario" for full documentation.
 */
import type { PermissionRepository } from '../repositories/permission.repository.js';
import type { AuthorizationResult, MatchedPermission } from '../types/authorization.js';
import { normalizePath, computeSpecificity, matchesResource } from '../utils/resource-matcher.js';
import { METHOD_TO_ACTION } from '../schemas/authorize.schema.js';
import type { HttpMethod } from '../types/authorization.js';

export class AuthorizationService {
  constructor(private readonly repo: PermissionRepository) {}

  /**
   * Evaluate whether the authenticated user may perform the given action on the resource.
   */
  authorize(userId: string, method: HttpMethod, apiPath: string): AuthorizationResult {
    // Step 1: normalize path → canonical resource string
    const resource = normalizePath(apiPath);

    // Step 2: map method → action
    const action = METHOD_TO_ACTION[method];

    // Step 3: fetch all (user, action) permissions from DB
    const allPermissions = this.repo.findByUserAndAction(userId, action);

    if (allPermissions.length === 0) {
      return {
        decision: 'DENY',
        reason: `No permissions found for user "${userId}" with action "${action}".`,
        matched_permissions: [],
      };
    }

    // Step 4: filter to matching resource patterns
    const matchingPermissions = allPermissions.filter(p =>
      matchesResource(p.resource, resource)
    );

    if (matchingPermissions.length === 0) {
      return {
        decision: 'DENY',
        reason: `No permission rule matches resource "${resource}" for user "${userId}" with action "${action}".`,
        matched_permissions: [],
      };
    }

    // Step 5: find the maximum specificity among matching rules
    const scoredPermissions = matchingPermissions.map(p => ({
      permission: p,
      specificity: computeSpecificity(p.resource),
    }));

    const maxSpecificity = Math.max(...scoredPermissions.map(sp => sp.specificity));

    const topPermissions = scoredPermissions
      .filter(sp => sp.specificity === maxSpecificity)
      .map(sp => sp.permission);

    // Step 6: build the matched_permissions response list (exclude id)
    const matched: MatchedPermission[] = topPermissions.map(p => ({
      action: p.action,
      resource: p.resource,
      effect: p.effect,
    }));

    // Step 7: DENY wins if any top-specificity rule is 'deny'
    const hasDeny = topPermissions.some(p => p.effect === 'deny');
    if (hasDeny) {
      return {
        decision: 'DENY',
        reason: `Permission explicitly denied for user "${userId}" on "${resource}" (action: "${action}").`,
        matched_permissions: matched,
      };
    }

    // Step 8: all top-specificity rules are 'allow' → ALLOW
    return {
      decision: 'ALLOW',
      reason: `Permission granted for user "${userId}" on "${resource}" (action: "${action}").`,
      matched_permissions: matched,
    };
  }
}
