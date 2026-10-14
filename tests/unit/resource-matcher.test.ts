/**
 * Unit tests: Resource matcher utility
 *
 * Tests normalizePath, computeSpecificity, and matchesResource
 * covering all wildcard semantics and edge cases.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizePath,
  computeSpecificity,
  matchesResource,
} from '../../src/utils/resource-matcher.js';

describe('normalizePath', () => {
  it('strips leading slash', () => {
    expect(normalizePath('/transactions')).toBe('transactions');
  });

  it('strips multiple leading slashes', () => {
    expect(normalizePath('//transactions')).toBe('transactions');
  });

  it('strips trailing slash', () => {
    expect(normalizePath('/transactions/')).toBe('transactions');
  });

  it('handles nested paths', () => {
    expect(normalizePath('/wallets/wallet-789/transactions')).toBe(
      'wallets/wallet-789/transactions'
    );
  });

  it('collapses double slashes in the middle', () => {
    expect(normalizePath('/wallets//wallet-789')).toBe('wallets/wallet-789');
  });

  it('handles deep nested paths', () => {
    expect(normalizePath('/wallets/wallet-456/transactions/txn-999')).toBe(
      'wallets/wallet-456/transactions/txn-999'
    );
  });

  it('throws on path traversal (..)', () => {
    expect(() => normalizePath('/wallets/../admin')).toThrow('Path must not contain ".." segments.');
    expect(() => normalizePath('/wallets/../admin')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => normalizePath('')).toThrow();
  });

  it('throws on whitespace-only string', () => {
    expect(() => normalizePath('   ')).toThrow();
  });

  it('throws on invalid characters', () => {
    expect(() => normalizePath('/wallet$123')).toThrow();
  });

  it('allows dots in segment names', () => {
    expect(normalizePath('/api/v1.2/resource')).toBe('api/v1.2/resource');
  });
});

describe('computeSpecificity', () => {
  it('global wildcard has specificity 0', () => {
    expect(computeSpecificity('*')).toBe(0);
  });

  it('single literal segment has highest score', () => {
    expect(computeSpecificity('transactions')).toBe(1000);
  });

  it('two literal segments score higher than one', () => {
    expect(computeSpecificity('wallets/wallet-789')).toBe(2000);
  });

  it('wildcard segment reduces score', () => {
    // 'wallets/*': 1 literal (1000) + 1 wildcard (-1) = 999
    expect(computeSpecificity('wallets/*')).toBe(999);
  });

  it('multi-level wildcard pattern', () => {
    // 'wallets/*/transactions/*': 2 literals (2000) + 2 wildcards (-2) = 1998
    expect(computeSpecificity('wallets/*/transactions/*')).toBe(1998);
  });

  it('more specific patterns score higher than less specific', () => {
    const specificScore = computeSpecificity('wallets/wallet-789/transactions');
    const wildcardScore = computeSpecificity('wallets/*/transactions');
    const globalScore = computeSpecificity('*');
    expect(specificScore).toBeGreaterThan(wildcardScore);
    expect(wildcardScore).toBeGreaterThan(globalScore);
  });
});

describe('matchesResource', () => {
  describe('global wildcard (*)', () => {
    it('matches any single-segment resource', () => {
      expect(matchesResource('*', 'transactions')).toBe(true);
    });

    it('matches any multi-segment resource', () => {
      expect(matchesResource('*', 'wallets/wallet-789/transactions')).toBe(true);
    });

    it('matches deep nested resource', () => {
      expect(matchesResource('*', 'accounts/acc-123/settings')).toBe(true);
    });
  });

  describe('exact matches', () => {
    it('matches exact resource', () => {
      expect(matchesResource('transactions', 'transactions')).toBe(true);
    });

    it('does not match partial resource', () => {
      expect(matchesResource('transactions', 'transactions/txn-456')).toBe(false);
    });

    it('does not match different resource', () => {
      expect(matchesResource('accounts', 'transactions')).toBe(false);
    });

    it('matches exact nested resource', () => {
      expect(matchesResource('wallets/wallet-789/transactions', 'wallets/wallet-789/transactions')).toBe(true);
    });
  });

  describe('single-segment wildcard', () => {
    it('wallets/* matches wallets/wallet-789', () => {
      expect(matchesResource('wallets/*', 'wallets/wallet-789')).toBe(true);
    });

    it('wallets/* matches wallets/any-id', () => {
      expect(matchesResource('wallets/*', 'wallets/any-id')).toBe(true);
    });

    it('wallets/* does NOT match wallets/wallet-789/transactions (depth mismatch)', () => {
      expect(matchesResource('wallets/*', 'wallets/wallet-789/transactions')).toBe(false);
    });

    it('wallets/* does NOT match transactions (prefix mismatch)', () => {
      expect(matchesResource('wallets/*', 'transactions')).toBe(false);
    });
  });

  describe('multi-level wildcard', () => {
    it('wallets/*/transactions/* matches wallets/wallet-456/transactions/txn-999', () => {
      expect(
        matchesResource('wallets/*/transactions/*', 'wallets/wallet-456/transactions/txn-999')
      ).toBe(true);
    });

    it('wallets/*/transactions/* matches wallets/wallet-789/transactions/txn-001', () => {
      expect(
        matchesResource('wallets/*/transactions/*', 'wallets/wallet-789/transactions/txn-001')
      ).toBe(true);
    });

    it('wallets/*/transactions/* does NOT match wallets/wallet-789/transactions (depth mismatch)', () => {
      expect(
        matchesResource('wallets/*/transactions/*', 'wallets/wallet-789/transactions')
      ).toBe(false);
    });

    it('wallets/*/transactions/* does NOT match wallets/wallet-789 (depth mismatch)', () => {
      expect(
        matchesResource('wallets/*/transactions/*', 'wallets/wallet-789')
      ).toBe(false);
    });
  });

  describe('parent resource non-inheritance (critical)', () => {
    it('wallets/wallet-789 does NOT match wallets/wallet-789/transactions', () => {
      // This is the key test for the assignment conflict resolution:
      // user456 has write on wallets/wallet-789 (2-segment exact)
      // POST /wallets/wallet-789/transactions maps to resource wallets/wallet-789/transactions (3-segment)
      // A 2-segment pattern cannot match a 3-segment resource → DENY is correct
      expect(matchesResource('wallets/wallet-789', 'wallets/wallet-789/transactions')).toBe(false);
    });

    it('wallets/wallet-789 does NOT match wallets/wallet-789/transactions/txn-1', () => {
      expect(matchesResource('wallets/wallet-789', 'wallets/wallet-789/transactions/txn-1')).toBe(false);
    });
  });
});
