/**
 * GitDaily 数据库升级方案
 *
 * 升级流程:
 * 1. 创建 backup_xxx.sqlite (备份当前数据库)
 * 2. 更新 schema_version 表中的版本号
 * 3. 执行迁移脚本
 * 4. 验证迁移结果
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initSchema, insertInitialData } from './schema';

const DB_PATH = './data/gitdaily.db';
const BACKUP_DIR = './data/backups';

// ==================== 版本定义 ====================
const SCHEMA_VERSIONS = {
  V1: '1.0.0',      // 初始版本
  V2: '1.1.0',      // 添加用户设置表
  V3: '1.2.0',      // 添加任务标签
  // 未来版本继续添加...
} as const;

type SchemaVersion = typeof SCHEMA_VERSIONS[keyof typeof SCHEMA_VERSIONS];

// ==================== 迁移定义 ====================
interface Migration {
  from: SchemaVersion;
  to: SchemaVersion;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;  // 可选回滚
}

const MIGRATIONS: Migration[] = [
  // V1 -> V2: 添加用户设置表
  {
    from: SCHEMA_VERSIONS.V1,
    to: SCHEMA_VERSIONS.V2,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT (datetime('now'))
        );

        INSERT INTO user_settings (key, value) VALUES
          ('theme', 'light'),
          ('branch_spacing', '1.0'),
          ('language', 'en');
      `);
    },
    down: (db) => {
      db.exec(`DROP TABLE IF EXISTS user_settings;`);
    }
  },

  // V2 -> V3: 添加任务标签
  {
    from: SCHEMA_VERSIONS.V2,
    to: SCHEMA_VERSIONS.V3,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL DEFAULT '#3b82f6',
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS task_tags (
          task_id TEXT NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (task_id, tag_id),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
      `);
    },
    down: (db) => {
      db.exec(`
        DROP TABLE IF EXISTS task_tags;
        DROP TABLE IF EXISTS tags;
      `);
    }
  },
];

// ==================== 核心类 ====================
export class DatabaseManager {
  private db: Database.Database;
  private currentVersion: string;

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.currentVersion = this.getVersion();
  }

  private getVersion(): string {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version TEXT PRIMARY KEY,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `);

    const row = this.db.prepare('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1').get() as { version: string } | undefined;
    return row?.version || SCHEMA_VERSIONS.V1;
  }

  private getAppliedMigrations(): string[] {
    const rows = this.db.prepare('SELECT version FROM schema_version').all() as { version: string }[];
    return rows.map(r => r.version);
  }

  createBackup(): string {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `gitdaily_backup_${timestamp}.sqlite`);

    this.db.pragma('wal_checkpoint(TRUNCAL)');
    fs.copyFileSync(DB_PATH, backupPath);
    return backupPath;
  }

  async upgrade(targetVersion?: SchemaVersion): Promise<{ success: boolean; backupPath: string; migrationsApplied: number }> {
    const target = targetVersion || Object.values(SCHEMA_VERSIONS).pop()!;
    const applied = this.getAppliedMigrations();

    console.log(`当前版本: ${this.currentVersion}`);
    console.log(`目标版本: ${target}`);

    const backupPath = this.createBackup();
    console.log(`备份创建: ${backupPath}`);

    const migrationsToApply = MIGRATIONS.filter(m => {
      const isNewer = Object.values(SCHEMA_VERSIONS).indexOf(m.to as SchemaVersion) >
                      Object.values(SCHEMA_VERSIONS).indexOf(this.currentVersion as SchemaVersion);
      const notApplied = !applied.includes(m.to);
      return isNewer && notApplied && m.to !== target;
    });

    let migrationsApplied = 0;
    const transaction = this.db.transaction(() => {
      for (const migration of migrationsToApply) {
        console.log(`执行迁移: ${migration.from} -> ${migration.to}`);
        migration.up(this.db);
        this.db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(migration.to);
        migrationsApplied++;
      }
    });

    try {
      transaction();
      this.currentVersion = this.getVersion();
      console.log(`升级成功! 当前版本: ${this.currentVersion}`);
      return { success: true, backupPath, migrationsApplied };
    } catch (error) {
      console.error('迁移失败:', error);
      console.log(`从备份恢复: ${backupPath}`);
      this.db.close();
      fs.copyFileSync(backupPath, DB_PATH);
      this.db = new Database(DB_PATH);
      return { success: false, backupPath, migrationsApplied: 0 };
    }
  }

  getInfo() {
    const stats = this.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM branches) as branch_count,
        (SELECT COUNT(*) FROM tasks) as task_count,
        (SELECT COUNT(*) FROM users) as user_count
    `).get() as any;

    return {
      version: this.currentVersion,
      path: DB_PATH,
      size: fs.statSync(DB_PATH).size,
      ...stats
    };
  }

  close() {
    this.db.close();
  }

  // 暴露内部 db 引用供 Repository 使用
  getDb() {
    return this.db;
  }
}

// ==================== 静态工厂方法 ====================
DatabaseManager.init = async function(): Promise<DatabaseManager> {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='branches'
  `).get() as any;

  if (!tables) {
    initSchema(db);
    insertInitialData(db);
  }

  return new DatabaseManager(DB_PATH);
} as () => Promise<DatabaseManager>;

// ==================== 初始化函数 ====================
export async function initDatabase(): Promise<DatabaseManager> {
  return DatabaseManager.init();
}
