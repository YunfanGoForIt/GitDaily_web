# GitDaily 数据库文档

## 概述

GitDaily 使用 **SQLite** 作为数据存储，提供轻量级、零配置的单文件数据库解决方案。

## 数据目录

```
data/
├── gitdaily.db          # 主数据库文件
└── backups/             # 自动备份目录
    └── gitdaily_backup_YYYY-MM-DDTHH-MM-SS.sqllite
```

## 数据模型

### branches (分支表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 分支唯一标识 (如: 'main', 'b1') |
| name | TEXT | NOT NULL | 分支名称 |
| description | TEXT | | 分支描述 |
| color | TEXT | NOT NULL | 分支颜色 (hex) |
| parent_id | TEXT | REFERENCES branches(id) | 父分支ID，null表示主分支 |
| status | TEXT | NOT NULL | 状态: active/merged/archived |
| start_date | TEXT | NOT NULL | 开始日期 |
| target_date | TEXT | | 目标日期 |
| merge_target_node_id | TEXT | | 合并到的任务节点ID |
| restored_date | TEXT | | 从归档恢复的日期 |
| created_at | TEXT | DEFAULT datetime('now') | 创建时间 |
| updated_at | TEXT | DEFAULT datetime('now') | 更新时间 |

### tasks (任务表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 任务唯一标识 (如: 't1') |
| branch_id | TEXT | NOT NULL, REFERENCES branches(id) | 所属分支ID |
| title | TEXT | NOT NULL | 任务标题 |
| description | TEXT | | 任务描述 |
| date | TEXT | NOT NULL | 任务日期 |
| status | TEXT | NOT NULL | 状态: PLANNED/COMPLETED |
| is_merge_commit | INTEGER | DEFAULT 0 | 是否为合并提交 |
| commit_message | TEXT | | 提交/反思信息 |
| created_at | TEXT | DEFAULT datetime('now') | 创建时间 |
| updated_at | TEXT | DEFAULT datetime('now') | 更新时间 |

### users (用户表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 用户ID |
| name | TEXT | NOT NULL | 用户名 |
| handle | TEXT | NOT NULL, UNIQUE | 用户Handle (@username) |
| avatar | TEXT | | 头像URL |
| bio | TEXT | | 个人简介 |
| created_at | TEXT | DEFAULT datetime('now') | 创建时间 |
| updated_at | TEXT | DEFAULT datetime('now') | 更新时间 |

### schema_version (版本追踪表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| version | TEXT | PRIMARY KEY | 数据库版本号 |
| applied_at | TEXT | DEFAULT datetime('now') | 迁移执行时间 |

## API 参考

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`

### 健康检查

```http
GET /health
```

响应:
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T04:00:00.000Z"
}
```

### 数据库状态

```http
GET /status
```

响应:
```json
{
  "version": "1.0.0",
  "path": "./data/gitdaily.db",
  "size": 4096,
  "branch_count": 4,
  "task_count": 8,
  "user_count": 1
}
```

### 分支操作

#### 获取所有分支

```http
GET /branches
```

响应:
```json
[
  {
    "id": "main",
    "name": "Main Timeline",
    "description": "Life Timeline",
    "color": "#9ca3af",
    "parent_id": null,
    "status": "active",
    "start_date": "2023-01-01"
  }
]
```

#### 获取单个分支

```http
GET /branches/:id
```

#### 创建分支

```http
POST /branches
Content-Type: application/json

{
  "id": "b4",
  "name": "New Feature",
  "description": "Description",
  "color": "#3b82f6",
  "parentId": "main",
  "status": "active",
  "startDate": "2026-02-02"
}
```

#### 更新分支

```http
PUT /branches/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated Description",
  "status": "archived"
}
```

#### 删除分支

```http
DELETE /branches/:id
```

### 任务操作

#### 获取所有任务

```http
GET /tasks
```

#### 获取单个任务

```http
GET /tasks/:id
```

#### 获取分支任务

```http
GET /tasks/branch/:branchId
```

#### 创建任务

```http
POST /tasks
Content-Type: application/json

{
  "id": "t10",
  "branchId": "b1",
  "title": "New Task",
  "description": "Task description",
  "date": "2026-02-02",
  "status": "PLANNED"
}
```

#### 更新任务

```http
PUT /tasks/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "COMPLETED",
  "commitMessage": "What I learned..."
}
```

#### 删除任务

```http
DELETE /tasks/:id
```

### 用户操作

#### 获取用户信息

```http
GET /user/profile
```

响应:
```json
{
  "id": "u1",
  "name": "Alex Johnson",
  "handle": "@alexj_gitto",
  "avatar": "https://picsum.photos/200",
  "bio": "Product Designer"
}
```

#### 更新用户信息

```http
PUT /user/profile
Content-Type: application/json

{
  "name": "New Name",
  "bio": "New bio"
}
```

### 管理操作

#### 创建备份

```http
POST /admin/backup
```

响应:
```json
{
  "success": true,
  "backupPath": "./data/backups/gitdaily_backup_2026-02-02T04-00-00.sqllite"
}
```

#### 执行数据库升级

```http
POST /admin/upgrade
```

响应:
```json
{
  "success": true,
  "backupPath": "./data/backups/gitdaily_backup_2026-02-02T04-00-00.sqllite",
  "migrationsApplied": 2
}
```

## 使用指南

### 安装依赖

```bash
npm install
```

### 初始化数据库

```bash
npm run db:migrate -- --info
```

### 启动 API 服务器

```bash
npm run server
```

服务器将在 http://localhost:3001 启动

### 使用 Docker 部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY ./data ./data
EXPOSE 3001
CMD ["npm", "run", "server"]
```

### 通过 ZeroTrust Tunnel 暴露

```bash
# 安装 cloudflared
cloudflared tunnel --url http://localhost:3001
```

## 备份与恢复

### 自动备份

每次执行 `npm run db:migrate` 或 `POST /admin/upgrade` 时，系统会自动：
1. 在 `data/backups/` 目录创建备份
2. 备份文件命名格式: `gitdaily_backup_YYYY-MM-DDTHH-MM-SS.sqllite`

### 手动备份

```bash
# 复制数据库文件
cp data/gitdaily.db data/backups/manual_backup_$(date +%Y%m%d).sqllite
```

### 恢复数据

```bash
# 停止服务器后
cp data/backups/gitdaily_backup_XXX.sqllite data/gitdaily.db
```

## 数据库升级流程

1. **版本检查**: 系统检查 `schema_version` 表
2. **自动备份**: 升级前自动创建备份
3. **执行迁移**: 按顺序执行待定迁移
4. **版本记录**: 记录已执行的迁移版本
5. **失败回滚**: 如失败自动从备份恢复

### 添加新迁移

在 `src/db/database.ts` 中添加:

```typescript
{
  from: '1.1.0',
  to: '1.2.0',
  up: (db) => {
    db.exec(`ALTER TABLE tasks ADD COLUMN new_field TEXT`);
  },
  down: (db) => {
    // 可选的回滚逻辑
  }
}
```
