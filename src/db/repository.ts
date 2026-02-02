/**
 * 数据访问层 (DAL)
 * 封装所有数据库操作
 */

import Database from 'better-sqlite3';
import { Branch, Task, UserProfile, TaskStatus } from '../types';

export class BranchRepository {
  constructor(private db: Database.Database) {}

  getAll() {
    return this.db.prepare('SELECT * FROM branches ORDER BY start_date ASC').all() as Branch[];
  }

  getById(id: string) {
    return this.db.prepare('SELECT * FROM branches WHERE id = ?').get(id) as Branch | undefined;
  }

  getActive() {
    return this.db.prepare("SELECT * FROM branches WHERE status = 'active'").all() as Branch[];
  }

  create(branch: Omit<Branch, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO branches (id, name, description, color, parent_id, status, start_date, target_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      branch.id, branch.name, branch.description, branch.color,
      branch.parentId, branch.status, branch.startDate, branch.targetDate
    );
  }

  update(id: string, updates: Partial<Branch>) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.targetDate !== undefined) { fields.push('target_date = ?'); values.push(updates.targetDate); }
    if (updates.mergeTargetNodeId !== undefined) { fields.push('merge_target_node_id = ?'); values.push(updates.mergeTargetNodeId); }
    if (updates.restoredDate !== undefined) { fields.push('restored_date = ?'); values.push(updates.restoredDate); }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  delete(id: string) {
    return this.db.prepare('DELETE FROM branches WHERE id = ?').run(id);
  }
}

export class TaskRepository {
  constructor(private db: Database.Database) {}

  getAll() {
    return this.db.prepare('SELECT * FROM tasks ORDER BY date DESC').all() as Task[];
  }

  getById(id: string) {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  }

  getByBranch(branchId: string) {
    return this.db.prepare('SELECT * FROM tasks WHERE branch_id = ? ORDER BY date ASC').all(branchId) as Task[];
  }

  getByStatus(status: TaskStatus) {
    return this.db.prepare('SELECT * FROM tasks WHERE status = ?').all(status) as Task[];
  }

  create(task: Omit<Task, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, branch_id, title, description, date, status, is_merge_commit, commit_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      task.id, task.branchId, task.title, task.description || null,
      task.date, task.status, task.isMergeCommit ? 1 : 0, task.commitMessage || null
    );
  }

  update(id: string, updates: Partial<Task>) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.commitMessage !== undefined) { fields.push('commit_message = ?'); values.push(updates.commitMessage); }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  delete(id: string) {
    return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  getStats() {
    return this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        COUNT(DISTINCT date) as active_days
      FROM tasks
    `).get() as any;
  }
}

export class UserRepository {
  constructor(private db: Database.Database) {}

  getProfile() {
    return this.db.prepare('SELECT * FROM users LIMIT 1').get() as UserProfile | undefined;
  }

  updateProfile(user: UserProfile) {
    const stmt = this.db.prepare(`
      UPDATE users SET name = ?, handle = ?, avatar = ?, bio = ?
    `);
    return stmt.run(user.name, user.handle, user.avatar, user.bio);
  }
}
