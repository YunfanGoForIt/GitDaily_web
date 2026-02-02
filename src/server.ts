/**
 * GitDaily API 服务器
 *
 * RESTful API 端点:
 * - GET  /api/health        - 健康检查
 * - GET  /api/status        - 数据库状态
 *
 * Branches:
 * - GET  /api/branches      - 获取所有分支
 * - GET  /api/branches/:id  - 获取单个分支
 * - POST /api/branches      - 创建分支
 * - PUT  /api/branches/:id  - 更新分支
 * - DELETE /api/branches/:id - 删除分支
 *
 * Tasks:
 * - GET  /api/tasks         - 获取所有任务
 * - GET  /api/tasks/:id     - 获取单个任务
 * - GET  /api/tasks/branch/:branchId - 获取分支任务
 * - POST /api/tasks         - 创建任务
 * - PUT  /api/tasks/:id     - 更新任务
 * - DELETE /api/tasks/:id   - 删除任务
 *
 * User:
 * - GET  /api/user/profile  - 获取用户信息
 * - PUT  /api/user/profile  - 更新用户信息
 *
 * Admin:
 * - POST /api/admin/backup  - 创建备份
 * - POST /api/admin/upgrade - 执行数据库升级
 */

import express from 'express';
import cors from 'cors';
import { DatabaseManager } from './db/database';
import { BranchRepository, TaskRepository, UserRepository } from './db/repository';

const DB_PATH = './data/gitdaily.db';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库和仓库
let dbManager: DatabaseManager | null = null;
let branchesRepo: BranchRepository | null = null;
let tasksRepo: TaskRepository | null = null;
let userRepo: UserRepository | null = null;

async function initRepos() {
  if (!dbManager) {
    dbManager = await DatabaseManager.init();
    branchesRepo = new BranchRepository(dbManager.getDb());
    tasksRepo = new TaskRepository(dbManager.getDb());
    userRepo = new UserRepository(dbManager.getDb());
  }
}

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/status', async (req, res) => {
  await initRepos();
  const info = (dbManager! as any).getInfo();
  res.json(info);
});

// ==================== Branches ====================
app.get('/api/branches', async (req, res) => {
  await initRepos();
  res.json(branchesRepo!.getAll());
});

app.get('/api/branches/:id', async (req, res) => {
  await initRepos();
  const branch = branchesRepo!.getById(req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

app.post('/api/branches', async (req, res) => {
  await initRepos();
  branchesRepo!.create(req.body);
  res.json({ success: true });
});

app.put('/api/branches/:id', async (req, res) => {
  await initRepos();
  branchesRepo!.update(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/branches/:id', async (req, res) => {
  await initRepos();
  branchesRepo!.delete(req.params.id);
  res.json({ success: true });
});

// ==================== Tasks ====================
app.get('/api/tasks', async (req, res) => {
  await initRepos();
  res.json(tasksRepo!.getAll());
});

app.get('/api/tasks/:id', async (req, res) => {
  await initRepos();
  const task = tasksRepo!.getById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.get('/api/tasks/branch/:branchId', async (req, res) => {
  await initRepos();
  res.json(tasksRepo!.getByBranch(req.params.branchId));
});

app.post('/api/tasks', async (req, res) => {
  await initRepos();
  tasksRepo!.create(req.body);
  res.json({ success: true });
});

app.put('/api/tasks/:id', async (req, res) => {
  await initRepos();
  tasksRepo!.update(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  await initRepos();
  tasksRepo!.delete(req.params.id);
  res.json({ success: true });
});

// ==================== User ====================
app.get('/api/user/profile', async (req, res) => {
  await initRepos();
  res.json(userRepo!.getProfile());
});

app.put('/api/user/profile', async (req, res) => {
  await initRepos();
  userRepo!.updateProfile(req.body);
  res.json({ success: true });
});

// ==================== Admin ====================
app.post('/api/admin/backup', async (req, res) => {
  await initRepos();
  const backupPath = (dbManager! as any).createBackup();
  res.json({ success: true, backupPath });
});

app.post('/api/admin/upgrade', async (req, res) => {
  await initRepos();
  const result = await (dbManager! as any).upgrade();
  res.json(result);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`GitDaily API Server running on port ${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (dbManager) (dbManager as any).close();
  process.exit(0);
});
