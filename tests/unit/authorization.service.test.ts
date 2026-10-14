/**
 * Unit tests: Authorization service
 *
 * Tests the permission decision engine with an in-memory SQLite database.
 * Covers all required sample scenarios, specificity rules, conflict resolution,
 * and the documented parent-inheritance policy.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PermissionRepository } from '../../src/repositories/permission.repository.js';
import { AuthorizationService } from '../../src/services/authorization.service.js';
import { initializeDatabase, closeDatabase, type DbInstance } from '../../src/config/database.js';

// ── Test fixture: in-memory database ─────────────────────────────────────────

let repo: PermissionRepository;
let service: AuthorizationService;
let db: DbInstance;

function setupDb(): void {
  db = initializeDatabase(':memory:');
  repo = new PermissionRepository(db);
  service = new AuthorizationService(repo);
}

function seedSampleData(): void {
  // user123
  repo.insert('user123', 'read',   'transactions',  'allow');
  repo.insert('user123', 'write',  'transactions',  'allow');
  repo.insert('user123', 'delete', 'transactions',  'deny');
  repo.insert('user123', 'read',   'accounts',      'allow');

  // user456
  repo.insert('user456', 'read',  'wallets/*',                      'allow');
  repo.insert('user456', 'write', 'wallets/wallet-789',              'allow');
  repo.insert('user456', 'read',  'wallets/wallet-789/transactions', 'allow');

  // user789
  // Two rules to cover both collection-level (3-segment) and item-level (4-segment) writes
  repo.insert('user789', 'write', 'wallets/*/transactions',   'allow');
  repo.insert('user789', 'write', 'wallets/*/transactions/*', 'allow');

  // admin789
  repo.insert('admin789', 'read',   '*', 'allow');
  repo.insert('admin789', 'write',  '*', 'allow');
  repo.insert('admin789', 'delete', '*', 'allow');
}

beforeEach(() => {
  closeDatabase();
  setupDb();
  seedSampleData();
});

afterEach(() => {
  closeDatabase();
});

// ── Required sample scenarios ─────────────────────────────────────────────────

describe('Required sample scenarios', () => {
  it('user123 can read transactions (GET /transactions → ALLOW)', () => {
    const result = service.authorize('user123', 'GET', '/transactions');
    expect(result.decision).toBe('ALLOW');
    expect(result.matched_permissions).toHaveLength(1);
    expect(result.matched_permissions[0]?.resource).toBe('transactions');
    expect(result.matched_permissions[0]?.effect).toBe('allow');
  });

  it('user123 cannot delete transactions (DELETE /transactions/txn-456 → DENY)', () => {
    // user123 has delete: deny on "transactions" (exact)
    // /transactions/txn-456 → resource = "transactions/txn-456" (2 segments)
    // "transactions" (1-segment exact) does NOT match "transactions/txn-456" (2-segment)
    // No applicable rule → default DENY
    const result = service.authorize('user123', 'DELETE', '/transactions/txn-456');
    expect(result.decision).toBe('DENY');
  });

  it('user456 can read wallet transactions (GET /wallets/wallet-789/transactions → ALLOW)', () => {
    const result = service.authorize('user456', 'GET', '/wallets/wallet-789/transactions');
    expect(result.decision).toBe('ALLOW');
    // Should match the exact rule wallets/wallet-789/transactions (more specific) over wallets/*
    const resources = result.matched_permissions.map(p => p.resource);
    expect(resources).toContain('wallets/wallet-789/transactions');
  });

  it('user789 can write a nested wallet transaction (POST /wallets/wallet-456/transactions/txn-999 → ALLOW)', () => {
    const result = service.authorize('user789', 'POST', '/wallets/wallet-456/transactions/txn-999');
    expect(result.decision).toBe('ALLOW');
    expect(result.matched_permissions[0]?.resource).toBe('wallets/*/transactions/*');
  });

  it('user789 can write wallet transactions collection (POST /wallets/wallet-789/transactions → ALLOW)', () => {
    // user789 has write: allow on wallets/*/transactions (3-segment pattern)
    // /wallets/wallet-789/transactions → resource = wallets/wallet-789/transactions (3 segments)
    // wallets/*/transactions matches because wallet-789 matches * and all segments align
    const result = service.authorize('user789', 'POST', '/wallets/wallet-789/transactions');
    expect(result.decision).toBe('ALLOW');
    expect(result.matched_permissions[0]?.resource).toBe('wallets/*/transactions');
  });

  it('user456 cannot write wallet transactions (POST /wallets/wallet-789/transactions → DENY)', () => {
    // Key conflict test:
    // user456 has write: allow on wallets/wallet-789 (2 segments)
    // Resource = wallets/wallet-789/transactions (3 segments)
    // Segment-count mismatch → no match → default DENY
    // This is the documented conflict resolution (no parent inheritance)
    const result = service.authorize('user456', 'POST', '/wallets/wallet-789/transactions');
    expect(result.decision).toBe('DENY');
  });

  it('admin789 has global delete permission (DELETE /accounts/acc-123/settings → ALLOW)', () => {
    const result = service.authorize('admin789', 'DELETE', '/accounts/acc-123/settings');
    expect(result.decision).toBe('ALLOW');
    expect(result.matched_permissions[0]?.resource).toBe('*');
  });

  it('unknown user has no permission (GET /transactions → DENY)', () => {
    const result = service.authorize('unknown-user', 'GET', '/transactions');
    expect(result.decision).toBe('DENY');
    expect(result.matched_permissions).toHaveLength(0);
  });
});

// ── Specificity and conflict resolution ───────────────────────────────────────

describe('Specificity and conflict resolution', () => {
  it('more-specific rule takes precedence over global wildcard', () => {
    closeDatabase();
    setupDb();
    // User has allow on * but deny on specific resource
    repo.insert('testuser', 'read', '*',            'allow');
    repo.insert('testuser', 'read', 'transactions', 'deny');

    const result = service.authorize('testuser', 'GET', '/transactions');
    expect(result.decision).toBe('DENY');
    expect(result.matched_permissions[0]?.resource).toBe('transactions');
  });

  it('equal-specificity deny overrides allow (deny wins on ties)', () => {
    closeDatabase();
    setupDb();
    repo.insert('testuser', 'read', 'transactions', 'allow');
    repo.insert('testuser', 'read', 'transactions', 'deny');

    const result = service.authorize('testuser', 'GET', '/transactions');
    expect(result.decision).toBe('DENY');
  });

  it('more-specific wildcard takes precedence over less-specific wildcard', () => {
    closeDatabase();
    setupDb();
    // wallets/wallet-789/transactions is more specific than wallets/*
    repo.insert('testuser', 'read', 'wallets/*',                      'allow');
    repo.insert('testuser', 'read', 'wallets/wallet-789/transactions', 'deny');

    // GET /wallets/wallet-789/transactions → should match both, use more specific (deny)
    const result = service.authorize('testuser', 'GET', '/wallets/wallet-789/transactions');
    expect(result.decision).toBe('DENY');
    expect(result.matched_permissions[0]?.resource).toBe('wallets/wallet-789/transactions');
  });

  it('default deny when no rules match', () => {
    closeDatabase();
    setupDb();
    const result = service.authorize('testuser', 'GET', '/transactions');
    expect(result.decision).toBe('DENY');
    expect(result.matched_permissions).toHaveLength(0);
  });

  it('default deny when action does not match (wrong HTTP method)', () => {
    closeDatabase();
    setupDb();
    repo.insert('testuser', 'read', 'transactions', 'allow');
    // POST → write, but only read is granted
    const result = service.authorize('testuser', 'POST', '/transactions');
    expect(result.decision).toBe('DENY');
  });
});

// ── Multi-level wildcard semantics ─────────────────────────────────────────────

describe('Multi-level wildcard semantics', () => {
  it('wallets/*/transactions/* matches wallets/wallet-456/transactions/txn-999', () => {
    closeDatabase();
    setupDb();
    repo.insert('testuser', 'write', 'wallets/*/transactions/*', 'allow');

    const result = service.authorize('testuser', 'POST', '/wallets/wallet-456/transactions/txn-999');
    expect(result.decision).toBe('ALLOW');
  });

  it('wallets/*/transactions/* does NOT match wallets/wallet-789/transactions (depth mismatch)', () => {
    closeDatabase();
    setupDb();
    repo.insert('testuser', 'write', 'wallets/*/transactions/*', 'allow');
    // This verifies segment-based matching: 4-segment pattern cannot match 3-segment resource
    const result = service.authorize('testuser', 'POST', '/wallets/wallet-789/transactions');
    expect(result.decision).toBe('DENY');
  });

  it('global wildcard matches deeply nested resources', () => {
    closeDatabase();
    setupDb();
    repo.insert('testuser', 'read', '*', 'allow');

    const result = service.authorize('testuser', 'GET', '/a/b/c/d/e/f');
    expect(result.decision).toBe('ALLOW');
  });
});

// ── Regression: user456 write conflict ───────────────────────────────────────

describe('Regression: user456 write permission conflict', () => {
  it('user456 write on wallets/wallet-789 does NOT grant access to wallets/wallet-789/transactions', () => {
    // Documented behavior: no parent inheritance.
    // user456 has write: allow on wallets/wallet-789 (2-segment exact).
    // POST /wallets/wallet-789/transactions → resource = wallets/wallet-789/transactions (3 segments).
    // 2-segment pattern cannot match 3-segment resource → DENY (correct per spec).
    const result = service.authorize('user456', 'POST', '/wallets/wallet-789/transactions');
    expect(result.decision).toBe('DENY');
    // Matched permissions should be empty (no matching write rule for 3-segment resource)
    expect(result.matched_permissions).toHaveLength(0);
  });

  it('user456 write permission on wallets/wallet-789 itself is preserved in database', () => {
    const permissions = repo.findByUserAndAction('user456', 'write');
    const walletPerm = permissions.find(p => p.resource === 'wallets/wallet-789');
    expect(walletPerm).toBeDefined();
    expect(walletPerm?.effect).toBe('allow');
  });
});
