# AI 云笔记 · AI Cloud Notes

一个支持 Markdown 的轻量云笔记应用。React + Vite 前端，Express + SQLite 后端，
容器化部署，附带 Jest 集成测试与 Playwright E2E 测试。

## 功能

- **账号体系** —— 注册 / 登录，JWT 鉴权，密码经 bcrypt 加盐哈希存储
- **笔记管理** —— 新建、编辑、删除、收藏
- **全文搜索** —— 按标题或正文关键词过滤
- **标签系统** —— 多标签归类，支持按标签筛选
- **数据隔离** —— 每个用户只能访问自己的笔记

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 · Vite 5 |
| 后端 | Node.js 20+ · Express 4 |
| 数据库 | SQLite（better-sqlite3，同步 API 零配置） |
| 鉴权 | JWT（jsonwebtoken）+ bcryptjs |
| 测试 | Jest + Supertest（集成）· Playwright（E2E） |
| 部署 | Docker Compose · Nginx · GitHub Actions |

> SQLite 是单文件数据库，无需额外服务即可跑起来。数据访问集中在
> `backend/src/db.js`，需要换成 PostgreSQL 时改动面很小。

## 快速开始

### 前置要求

- Node.js ≥ 20（推荐 20 / 22 LTS）
- Docker（可选，仅容器化部署时需要）

### 本地开发

```bash
# 1. 后端
cd backend
cp .env.example .env      # 首次必须：否则会报 JWT_SECRET is not defined
npm install
npm run dev               # → http://localhost:3000

# 2. 前端（另开一个终端）
cd frontend
npm install
npm run dev               # → http://localhost:5173
```

打开 http://localhost:5173 ，注册一个账号即可开始使用。

验证后端是否正常：

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}
```

> **关于 `npm ci`**：仓库已提交 `package-lock.json`，CI 与 Docker 构建使用
> `npm ci` 以获得可复现的依赖安装。本地首次搭建也可以用 `npm ci`。

<details>
<summary>安装依赖报原生模块编译错误？</summary>

`better-sqlite3` 是原生模块。如果 npm 无法下载到预编译二进制，会回落到本地编译，
在 Windows 上通常以 `gyp ERR! find VS You need to install the latest version of Visual Studio` 失败。

仓库根目录的 `.npmrc` 已配置国内镜像（含二进制镜像），正常情况下无需处理。
若仍失败，可手动指定：

```bash
npm install --better-sqlite3_binary_host_mirror=https://registry.npmmirror.com/-/binary/better-sqlite3
```

</details>

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 后端监听端口 |
| `JWT_SECRET` | 开发占位符 | 🔴 生产环境必须替换为随机字符串 |
| `DB_PATH` | `./data/notes.db` | SQLite 文件路径 |

生成一个安全的密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API

所有 `/api/notes` 接口都需要在请求头携带 token：

```
Authorization: Bearer <token>
```

### 认证

| 方法 | 路径 | 说明 | 成功状态码 |
|---|---|---|---|
| `POST` | `/api/auth/register` | 注册 | `201` |
| `POST` | `/api/auth/login` | 登录 | `200` |

请求体 `{ "username": "...", "password": "..." }`（密码至少 6 位），
响应 `{ "token": "...", "userId": "...", "username": "..." }`。

### 笔记

| 方法 | 路径 | 说明 | 成功状态码 |
|---|---|---|---|
| `GET` | `/api/notes` | 列表，支持查询参数 | `200` |
| `GET` | `/api/notes/:id` | 详情 | `200` |
| `POST` | `/api/notes` | 新建 | `201` |
| `PUT` | `/api/notes/:id` | 更新（字段可选，局部更新） | `200` |
| `DELETE` | `/api/notes/:id` | 删除 | `204` |

`GET /api/notes` 支持的查询参数：

| 参数 | 示例 | 说明 |
|---|---|---|
| `search` | `?search=会议` | 标题或正文包含关键词 |
| `tag` | `?tag=学习` | 含指定标签 |
| `favorite` | `?favorite=true` | 只看收藏 |

笔记对象结构：

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "标题",
  "content": "正文",
  "tags": ["学习", "AI"],
  "is_favorite": false,
  "created_at": "2026-01-01 12:00:00",
  "updated_at": "2026-01-01 12:00:00"
}
```

### 健康检查

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/health` | 存活探测，供容器与 CI 使用 |

### 错误响应

统一格式 `{ "error": "错误说明" }`：

| 状态码 | 场景 |
|---|---|
| `400` | 参数缺失，如标题为空、密码不足 6 位 |
| `401` | 未携带 token、token 无效或已过期、账号密码错误 |
| `404` | 笔记不存在（或不属于当前用户） |
| `409` | 注册时用户名已存在 |

## 测试

### 后端集成测试

```bash
cd backend
npm test
```

用例覆盖认证流程、笔记 CRUD、搜索与健康检查，使用 Supertest 直接调用
Express 应用，不占用端口。

> 测试会通过 `backend/jest.config.js` 的 `setupFiles` 把数据库指向
> `backend/data/test.db`，**不会影响 `data/notes.db` 里的开发数据**。

### E2E 测试

```bash
# 先确保前后端都在运行
cd tests-e2e
npm install
npm run install-browser   # 首次需要下载 Chromium
npx playwright test

npx playwright test --headed   # 显示浏览器界面
npx playwright test --ui       # 交互式调试
```

E2E 使用 `data-testid` 定位元素（见 `frontend/src/App.jsx`）。

## Docker 部署

```bash
# 构建并启动（前端 5173 → 容器 80，后端 3000）
docker compose up -d --build

docker compose ps                        # 查看状态
docker compose logs -f backend           # 查看后端日志
curl http://localhost:3000/api/health    # 健康检查

docker compose down                      # 停止（数据保留在 ./backend/data）
docker compose down -v                   # 停止并删除数据卷
```

数据库通过 volume 挂载到 `./backend/data`，容器重建不会丢数据。

> ⚠️ 前端镜像目前用 Nginx 托管静态文件，但**尚未配置 `/api` 反向代理**。
> 容器化部署时前端的接口请求需要额外处理（补 Nginx 配置，或让前端走同源网关）。

## CI/CD

`.github/workflows/deploy.yml` 定义了两阶段流水线：

1. **test** —— `push` 到 `develop` 或 `main` 时，安装依赖、跑 Jest、构建前端
2. **deploy** —— 仅 `main` 分支，测试通过后经 SSH 部署到服务器并做健康检查

需要在仓库 Settings → Secrets 中配置：

| Secret | 说明 |
|---|---|
| `SERVER_IP` | 服务器地址 |
| `SERVER_USER` | SSH 用户名 |
| `SSH_PRIVATE_KEY` | 部署用私钥全文 |
| `JWT_SECRET` | 生产环境 JWT 密钥 |

## 项目结构

```
.
├── backend/
│   ├── src/
│   │   ├── server.js           # Express 入口（listen 有 require.main 守卫，便于测试）
│   │   ├── db.js               # SQLite 连接与建表
│   │   ├── middleware/auth.js  # JWT 校验与签发
│   │   └── routes/
│   │       ├── auth.js         # 注册 / 登录
│   │       └── notes.js        # 笔记 CRUD、搜索、标签、收藏
│   ├── tests/
│   │   ├── setup.js            # 测试库隔离
│   │   └── integration.test.js
│   ├── jest.config.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # 主界面（内联样式，含 data-testid）
│   │   ├── api.js              # fetch 封装，自动注入 token
│   │   └── main.jsx
│   ├── vite.config.js          # 开发代理：/api → localhost:3000
│   └── Dockerfile              # 多阶段构建：Node → Nginx
├── tests-e2e/
│   ├── notes.spec.js           # 完整用户流程
│   └── playwright.config.js
├── .github/workflows/deploy.yml
├── docker-compose.yml
└── .npmrc                      # 镜像与原生模块二进制源
```

## 数据库结构

```sql
users (id PK, username UNIQUE, password_hash, created_at)

notes (id PK, user_id FK → users.id, title, content,
       tags /* JSON 字符串 */, is_favorite /* 0/1 */,
       created_at, updated_at)
```

表结构在 `backend/src/db.js` 的 `initDB()` 中以 `CREATE TABLE IF NOT EXISTS`
方式声明，应用启动时自动执行，无需手动迁移。

## License

MIT
