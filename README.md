<div align="center">

# GitDaily

**像管理 Git 分支一样管理你的生活和项目**



---

## 设计哲学

GitDaily 源于一个核心洞察：**人生如 Git**。

在 Git 中，我们有：
- **Main 分支** - 主时间线，代表人生主线
- **Feature Branches** - 平行项目、生活尝试
- **Commits** - 每一个有意义的节点
- **Merge Branch** - 完成阶段性目标后的整合

GitDaily 将这些概念可视化，让你能：

### 1. 看见时间流向
传统待办列表是线性的、扁平的。GitDaily 用**分支图**展示你的时间和精力流向，直观呈现：
- 主线任务 vs 支线任务
- 任务之间的依赖关系
- 完成/计划的分布

### 2. 反思式完成
每个任务/分支完成时，强制要求填写**反思信息**（类似 Git Commit Message）。这不只是记录"做了什么"，更是思考"学到了什么"、"下次可以如何改进"。

### 3. 轻量级持久化
不需要数据库服务器，不需要复杂的安装。SQLite 单文件存储，随时备份、随时迁移。

---

## 核心功能

### 分支管理
- 创建平行分支（项目/生活尝试）
- 设置分支颜色、目标日期
- 归档、恢复、删除分支
- 合并分支到父分支

### 任务追踪
- 任务作为"提交"节点
- 按日/周/月查看
- 同日任务自动垂直错开
- 完成时记录反思

### 数据可视化
- 交互式分支时间图
- 贡献热度图（GitHub 风格）
- 粒度切换（日/周/月）

### 搜索功能
- 全局搜索分支和任务
- 快速导航

### 个人资料
- 头像本地上传
- 统计总提交数

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS |
| 图表 | SVG 自定义渲染 |
| 后端 | Express.js REST API |
| 数据库 | SQLite (better-sqlite3) |
| 图标 | Lucide React + 自定义 SVG |

---

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 一键启动前后端（推荐）
./start.sh

# 或者手动启动
npm run server &   # API 服务器 (端口 3001)
npm run dev        # 前端 (端口 3000)
```

访问 http://localhost:3000

### 环境变量

创建 `.env.local`：

```bash
GEMINI_API_KEY=your_gemini_api_key  # 可选，AI 功能
```

---

## 自部署

### 方案一：VPS/服务器

```bash
# 1. 安装 Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 克隆并安装
git clone https://github.com/yourusername/GitDaily.git
cd GitDaily
npm install

# 3. 启动 API 服务器
npm run server &

# 4. 构建前端
npm run build

# 5. 使用 nginx 或其他服务器托管 dist/ 目录
```

### 方案二：通过 Cloudflare ZeroTrust Tunnel（推荐）

无需公网 IP，随时随地访问：

```bash
# 安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# 启动隧道
./cloudflared tunnel --url http://localhost:3000
```

输出类似：
```
2024-01-01T00:00:00Z INF Connection established ...
https://random-uuid.trycloudflare.com -> http://localhost:3000
```

分享这个 HTTPS URL，手机和电脑都能访问同一份数据。

### 方案三：Docker

```dockerfile
FROM node:20-alpine

# 安装编译依赖（better-sqlite3 需要）
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
COPY data ./data

EXPOSE 3001
CMD ["npm", "run", "server"]
```

```bash
docker build -t gitdaily .
docker run -p 3001:3001 -v gitdaily_data:/app/data gitdaily
```

然后用 nginx 反向代理或 cloudflared 暴露。

---

## 数据备份

数据库位置：`data/gitdaily.db`

```bash
# 手动备份
cp data/gitdaily.db data/backups/gitdaily_$(date +%Y%m%d).db

# 自动备份（每次迁移前会创建）
ls data/backups/
```

---

## 项目结构

```
GitDaily/
├── src/
│   ├── api.ts              # 前端 API 服务层
│   ├── App.tsx             # 主应用（状态管理）
│   ├── server.ts           # Express API 服务器
│   ├── db/
│   │   ├── schema.ts       # 数据库 Schema
│   │   ├── database.ts     # DatabaseManager + 迁移
│   │   ├── repository.ts   # 数据访问层
│   │   └── cli.ts          # CLI 工具
│   ├── components/         # React 组件
│   └── pages/              # 页面
├── data/                   # 数据库文件
│   └── gitdaily.db
├── docs/
│   └── DATABASE.md         # 数据库文档
├── private_icons/          # 自定义图标
└── start.sh                # 启动脚本
```

---

## License

MIT

---

**像 Git 一样管理人生，让每一个"提交"都有意义。**
