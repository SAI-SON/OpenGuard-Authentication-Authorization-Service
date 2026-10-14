/**
 * Database initialization and seeding script.
 *
 * Usage: npm run db:seed
 *
 * Behavior:
 * - Creates the database file and directory if they don't exist.
 * - Creates the user_permissions table if it doesn't exist (preserves existing data).
 * - Only inserts sample data if the table is empty (idempotent on re-runs).
 *
 * The sample dataset is the complete set from the assignment specification,
 * with an additional rule for user789 to cover collection-level writes
 * (see README.md § "Conflicting Sample Scenario").
 */
import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from '../src/config/database.js';

const DB_PATH = process.env['DATABASE_PATH'] ?? './data/permissions.db';

interface SeedPermission {
  user_id: string;
  action: string;
  resource: string;
  effect: 'allow' | 'deny';
}

const SAMPLE_PERMISSIONS: SeedPermission[] = [
  // user123
  { user_id: 'user123', action: 'read',   resource: 'transactions',  effect: 'allow' },
  { user_id: 'user123', action: 'write',  resource: 'transactions',  effect: 'allow' },
  { user_id: 'user123', action: 'delete', resource: 'transactions',  effect: 'deny'  },
  { user_id: 'user123', action: 'read',   resource: 'accounts',      effect: 'allow' },

  // user456
  { user_id: 'user456', action: 'read',  resource: 'wallets/*',                      effect: 'allow' },
  { user_id: 'user456', action: 'write', resource: 'wallets/wallet-789',              effect: 'allow' },
  { user_id: 'user456', action: 'read',  resource: 'wallets/wallet-789/transactions', effect: 'allow' },

  // user789
  // wallets/*/transactions/* matches 4-segment paths (specific transaction items)
  // wallets/*/transactions   matches 3-segment paths (transaction collections)
  // Both rules are needed to cover POST on a collection AND on individual items.
  { user_id: 'user789', action: 'write', resource: 'wallets/*/transactions',   effect: 'allow' },
  { user_id: 'user789', action: 'write', resource: 'wallets/*/transactions/*', effect: 'allow' },

  // admin789
  { user_id: 'admin789', action: 'read',   resource: '*', effect: 'allow' },
  { user_id: 'admin789', action: 'write',  resource: '*', effect: 'allow' },
  { user_id: 'admin789', action: 'delete', resource: '*', effect: 'allow' },
];

function seed(): void {
  console.log(`[seed] Initializing database at: ${DB_PATH}`);
  const db = initializeDatabase(DB_PATH);

  // Check if data already exists
  const row = db.prepare('SELECT COUNT(*) as cnt FROM user_permissions').get() as { cnt: number };
  const count = row.cnt;

  if (count > 0) {
    console.log(`[seed] Database already contains ${count} record(s). Skipping seed to preserve existing data.`);
    console.log('[seed] To reseed, delete the database file and re-run: npm run db:seed');
    db.close();
    return;
  }

  // Insert sample permissions using a transaction for atomicity
  const insert = db.prepare(
    'INSERT INTO user_permissions (user_id, action, resource, effect) VALUES (?, ?, ?, ?)'
  );

  // node:sqlite doesn't expose transaction() directly; use BEGIN/COMMIT
  db.exec('BEGIN');
  try {
    for (const p of SAMPLE_PERMISSIONS) {
      insert.run(p.user_id, p.action, p.resource, p.effect);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const newRow = db.prepare('SELECT COUNT(*) as cnt FROM user_permissions').get() as { cnt: number };
  console.log(`[seed] Inserted ${newRow.cnt} sample permission records.`);
  console.log('[seed] Done.');
  db.close();
}

seed();
