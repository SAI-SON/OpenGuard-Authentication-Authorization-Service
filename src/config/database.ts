/**
 * SQLite database initialization using the built-in node:sqlite module.
 *
 * Requires Node.js >= 22.5.0 (node:sqlite was added in v22.5.0, stable in v24).
 *
 * Design decisions:
 * - Uses WAL journal mode for better concurrent read performance.
 * - Creates the table and indexes only if they don't exist, so existing
 *   databases (e.g., supplied by the assignment) are preserved safely.
 * - Uses the synchronous DatabaseSync API which is appropriate for a
 *   request-scoped permission lookup in Node.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';

// Node.js >= 22.5.0 provides node:sqlite built-in.
// In CommonJS environments, require('node:sqlite') loads it synchronously
// without triggering bundler resolution issues with bare specifiers.
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: typeof DatabaseSyncType;
};

export type DbInstance = DatabaseSyncType;

let _db: DbInstance | null = null;

export function initializeDatabase(dbPath: string): DbInstance {
  if (_db) return _db;

  // For in-memory databases (':memory:'), skip directory creation
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Performance and safety settings
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA synchronous = NORMAL');

  // Create the table if it does not already exist.
  // This preserves any existing data when a pre-populated database is provided.
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT    NOT NULL,
      action  TEXT    NOT NULL,
      resource TEXT   NOT NULL,
      effect  TEXT    NOT NULL CHECK(effect IN ('allow','deny'))
    );

    CREATE INDEX IF NOT EXISTS idx_user_permissions_user_action
      ON user_permissions(user_id, action);
  `);

  _db = db;
  return db;
}

export function getDatabase(): DbInstance {
  if (!_db) {
    throw new Error(
      'Database has not been initialized. Call initializeDatabase() first.'
    );
  }
  return _db;
}

/** Close and reset the database (used in tests to obtain a clean state) */
export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
