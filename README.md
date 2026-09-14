# 🚀 AI 云笔记 (AI Cloud Notes)

> **练手项目**：专治「Git/部署交给 AI 黑盒」的痛点
> **技术栈**：React + Vite + Express + SQLite + Docker
> **适合人群**：非科班、会用 AI 编程、但交付环节薄弱的同学

---

## 📁 项目结构

```
ai-cloud-notes/
├── backend/                    # 后端 (Express + SQLite)
│   ├── src/
│   │   ├── server.js           # 入口
│   │   ├── db.js               # 数据库初始化
│   │   ├── middleware/auth.js  # JWT 鉴权
│   │   └── routes/
│   │       ├── auth.js         # 注册/登录
│   │       └── notes.js        # 笔记 CRUD
│   ├── tests/
│   │   └── integration.test.js # 集成测试 (Jest + Supertest)
│   ├── Dockerfile
│   ├── .gitignore
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # 前端 (React + Vite)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx             # 主组件（登录 + 笔记 CRUD）
│   │   └── api.js              # API 封装
│   ├── Dockerfile              # 多阶段构建 (Node → Nginx)
│   ├── vite.config.js          # 代理配置
│   ├── .gitignore
│   └── package.json
│
├── tests-e2e/                  # Playwright E2E 测试
│   ├── notes.spec.js
│   └── playwright.config.js
│
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions CI/CD
│
├── docker-compose.yml          # 一键启动前后端
└── README.md
```

---

## 🚀 快速开始（本地开发）

### 前置要求
- Node.js 20+
- Docker（可选，用于容器化部署）

### 1. 克隆项目
```bash
git clone <你的仓库URL>
cd ai-cloud-notes
```

### 2. 启动后端
```bash
cd backend
cp .env.example .env       # 首次需要
npm ci
npm run dev                # 开发模式（nodemon 热重载）
```

### 3. 启动前端（新终端）
```bash
cd frontend
npm ci
npm run dev                # http://localhost:5173
```

打开 http://localhost:5173 即可使用！

### 4. 跑测试
```bash
# 后端单元测试
cd backend && npm test

# E2E 测试（需先启动前后端）
cd tests-e2e && npx playwright test
```

---

## 🐳 Docker 一键部署

```bash
# 构建 + 启动所有服务
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志（🔴 排错必备）
docker compose logs -f backend

# 验证健康检查
curl http://localhost:3000/api/health

# 停止
docker compose down

# 停止 + 清除数据（⚠️ 会删数据库）
docker compose down -v
```

访问 http://localhost:5173 使用。

---

## 🔄 Git 分支工作流（🔴 必须亲手做）

```
main        ← 线上稳定版（受保护，只能 PR 合入）
develop     ← 测试/联调分支
feature/xxx ← 功能开发（从 develop 拉，完成后合回 develop）
hotfix/xxx  ← 紧急修复（从 main 拉，合回 main + develop）
```

### 标准流程（每个功能都这样走一遍）
```bash
# 1. 确保 develop 是最新
git checkout develop && git pull

# 2. 拉功能分支
git checkout -b feature/login

# 3. AI 帮你写代码... 你审 `git diff`

# 4. 🔴 亲手提交（规范 message）
git add .
git commit -m "feat(auth): 用户登录接口"
git push -u origin feature/login

# 5. 合到 develop → 触发测试
git checkout develop
git merge feature/login --no-ff
git push origin develop

# 6. 测试通过后，合 main + 打标签
git checkout main && git merge develop --no-ff
git tag -a v1.0.0 -m "完成登录与笔记 CRUD"
git push origin main --tags
```

### Commit Message 规范
- `feat:` 新功能
- `fix:` 修 bug
- `docs:` 文档
- `chore:` 构建/工具
- `test:` 测试
- `refactor:` 重构

---

## 🤖 CI/CD（GitHub Actions）

**流程**：
1. `push develop` → 自动跑 Jest 测试 + 前端构建
2. `push main` → 测试通过后 → SSH 到服务器 → 重新部署
3. 部署后自动健康检查 → 打印日志

**配置方法**（一次配好，终身受用）：
1. 生成 SSH 密钥：`ssh-keygen -t ed25519 -f ~/.ssh/github_actions`
2. **公钥**加到服务器：`ssh-copy-id -i ~/.ssh/github_actions.pub root@服务器IP`
3. **私钥**加到 GitHub Secrets：
   - `SERVER_IP` - 你的服务器 IP
   - `SERVER_USER` - root（或你的用户名）
   - `SSH_PRIVATE_KEY` - 私钥全文
   - `JWT_SECRET` - 随机字符串

---

## 📋 4 周练习计划

| 周次 | 重点 | 验收标准 |
|------|------|---------|
| **第 1 周** | Git 分支 + commit 规范 | 亲手管理 `feature → develop → main`，打 3 个 Tag |
| **第 2 周** | AI 写代码 + 你审 + TDD | 每个功能有测试，合 develop 前测试全绿 |
| **第 3 周** | Docker + 本地部署 | `docker compose up` 跑通，会看日志排错 |
| **第 4 周** | 服务器 + CI/CD | push main 自动部署，线上能访问 |

---

## 🎯 练习要点

> **铁律**：AI 给的命令，你能看懂它在干什么；出事了，你知道去哪里查。

- ✅ 每条命令**先自己敲一遍**，别让 AI 代劳
- ✅ AI 写完代码，`git diff` 看一眼再合
- ✅ 部署完**必须 SSH 上去** `curl http://localhost:3000/api/health` 验证
- ✅ 日志出问题，`docker compose logs -f` 是第一招

---

## 📝 License

MIT - 随便用，练手为主 🎉
