/**
 * Permission repository: parameterized SQLite queries for permission lookups.
 *
 * Uses the built-in node:sqlite DatabaseSync API (Node.js >= 22.5.0).
 * All queries use parameterized prepared statements to prevent SQL injection.
 * No dynamic SQL string concatenation is used.
 */
import type { DbInstance } from '../config/database.js';
import type { Permission } from '../types/authorization.js';

export class PermissionRepository {
  constructor(private readonly db: DbInstance) {}

  /**
   * Retrieve all permissions for a given user and action.
   * Returns all resource patterns so the authorization engine can
   * apply wildcard matching and specificity scoring in memory.
   */
  findByUserAndAction(userId: string, action: string): Permission[] {
    const stmt = this.db.prepare(`
      SELECT id, user_id, action, resource, effect
      FROM   user_permissions
      WHERE  user_id = ?
        AND  action  = ?
    `);
    return stmt.all(userId, action) as unknown as Permission[];
  }

  /**
   * Retrieve all permissions for a given user (any action).
   */
  findAllByUser(userId: string): Permission[] {
    const stmt = this.db.prepare(`
      SELECT id, user_id, action, resource, effect
      FROM   user_permissions
      WHERE  user_id = ?
    `);
    return stmt.all(userId) as unknown as Permission[];
  }

  /**
   * Insert a new permission record.
   * Returns the auto-assigned id.
   */
  insert(
    userId: string,
    action: string,
    resource: string,
    effect: 'allow' | 'deny'
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO user_permissions (user_id, action, resource, effect)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, action, resource, effect);
    return Number(result.lastInsertRowid);
  }

  /**
   * Retrieve all permissions across all users.
   */
  findAll(): Permission[] {
    const stmt = this.db.prepare(`
      SELECT id, user_id, action, resource, effect
      FROM   user_permissions
      ORDER BY id DESC
    `);
    return stmt.all() as unknown as Permission[];
  }

  /**
   * Delete a single permission by its primary key ID.
   */
  deleteById(id: number): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM user_permissions
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return Number(result.changes) > 0;
  }

  /**
   * Delete all records (used in tests to reset state between cases).
   */
  deleteAll(): void {
    this.db.prepare('DELETE FROM user_permissions').run();
  }
}
