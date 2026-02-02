/**
 * GitDaily 数据库 Schema 定义
 *
 * 表结构:
 * - schema_version: 版本追踪
 * - users: 用户信息
 * - branches: 分支表
 * - tasks: 任务表
 */

import Database from 'better-sqlite3';

export function initSchema(db: Database.Database) {
  db.exec(`
    -- ==================== 版本追踪表 ====================
    CREATE TABLE IF NOT EXISTS schema_version (
      version TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );

    -- ==================== 用户表 ====================
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ==================== 分支表 ====================
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#9ca3af',
      parent_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL,
      target_date TEXT,
      merge_target_node_id TEXT,
      restored_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    -- ==================== 任务表 ====================
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PLANNED',
      is_merge_commit INTEGER DEFAULT 0,
      commit_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    -- ==================== 索引 ====================
    CREATE INDEX IF NOT EXISTS idx_branches_parent_id ON branches(parent_id);
    CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_branch_id ON tasks(branch_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

    -- ==================== 触发器 ====================
    -- 自动更新 updated_at
    CREATE TRIGGER IF NOT EXISTS update_branches_updated_at
      AFTER UPDATE ON branches
      FOR EACH ROW
      BEGIN
        UPDATE branches SET updated_at = datetime('now') WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at
      AFTER UPDATE ON tasks
      FOR EACH ROW
      BEGIN
        UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
      END;

    CREATE TRIGGER IF NOT EXISTS update_users_updated_at
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
  `);
}

// 初始数据
export function insertInitialData(db: Database.Database) {
  const now = new Date().toISOString().split('T')[0];

  // 插入主分支
  db.prepare(`
    INSERT OR IGNORE INTO branches (id, name, description, color, parent_id, status, start_date)
    VALUES ('main', 'Main Timeline', 'Life Timeline', '#9ca3af', NULL, 'active', '2023-01-01')
  `).run();

  // 插入示例分支
  db.prepare(`
    INSERT OR IGNORE INTO branches (id, name, description, color, parent_id, status, start_date)
    VALUES
      ('b1', 'Website Redesign', 'Overhaul the corporate website', '#10b981', 'main', 'active', ?)
  `).run(now);

  db.prepare(`
    INSERT OR IGNORE INTO branches (id, name, description, color, parent_id, status, start_date)
    VALUES
      ('b2', 'Mobile Opt', 'Fix mobile responsiveness', '#f59e0b', 'b1', 'active', ?)
  `).run(now);

  db.prepare(`
    INSERT OR IGNORE INTO branches (id, name, description, color, parent_id, status, start_date)
    VALUES
      ('b3', 'Marketing', 'Launch campaign', '#8b5cf6', 'main', 'active', ?)
  `).run(now);

  // 插入初始任务
  db.prepare(`
    INSERT OR IGNORE INTO tasks (id, branch_id, title, description, date, status)
    VALUES
      ('t1', 'main', 'Project Kickoff', 'Initial project meeting', ?, 'COMPLETED'),
      ('t3', 'b1', 'Design System', 'Create component library', ?, 'COMPLETED'),
      ('t4', 'b1', 'Home Page Mockup', 'Design homepage', ?, 'COMPLETED'),
      ('t5', 'b1', 'About Page', 'Design about page', ?, 'PLANNED'),
      ('t6', 'b2', 'Touch Gestures', 'Implement touch gestures', ?, 'COMPLETED'),
      ('t7', 'b2', 'Responsive Nav', 'Make nav responsive', ?, 'PLANNED'),
      ('t8', 'b3', 'Ad Copy', 'Write advertisement copy', ?, 'COMPLETED'),
      ('t9', 'b3', 'Launch Campaign', 'Launch marketing campaign', ?, 'PLANNED')
  `).run(now, now, now, now, now, now, now, now);

  // 插入示例用户
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, handle, avatar, bio)
    VALUES ('u1', 'Alex Johnson', '@alexj_gitto', 'https://picsum.photos/200', 'Product Designer & Frontend Developer')
  `).run();

  // 插入初始版本记录
  db.prepare(`
    INSERT OR IGNORE INTO schema_version (version)
    VALUES ('1.0.0')
  `).run();
}
