# 🚀 AI 云笔记 · 练手实战指南（Codex 专用）

> **适用对象**：非科班、会用 AI 编程、但「Git / 部署 / 排错」交给 AI 黑盒的同学
> **使用方式**：明天打开 Codex（或 Cursor / Copilot），**照着这份文档一步步走**，遇到报错先自己读，再让 AI 帮你
> **核心心法**：🔴 **AI 负责写，你负责：敲命令、看报错、查日志、做决策**

---

## 一、开始前必读：你的角色定位

| 环节 | AI 做 | 你做（必须亲手） |
|------|-------|------------------|
| 拆需求 / PRD | 🟡 AI 起草 | ✅ 你定稿 |
| 写代码 | 🟢 AI 生成 | ✅ `git diff` 审一遍 |
| 写测试 | 🟢 AI 生成 | ✅ 审断言、跑测试 |
| **Git 分支 / commit / merge** | ❌ | 🔴 **全是你** |
| **Docker 命令 / 看日志** | ❌ | 🔴 **全是你** |
| **服务器部署 / 排错** | ❌ | 🔴 **全是你** |
| CI/CD 配置 | 🟡 AI 写 | ✅ 你读懂每一行 |

> ⚠️ **铁律**：凡是「🔴 全是你」的部分，**不要让 AI 代敲命令**。你只让 AI「解释这条命令在干什么」。

---

## 二、项目结构速览

```
ai-cloud-notes/
├── backend/                # Express + SQLite 后端
│   ├── src/
│   │   ├── server.js       # 入口
│   │   ├── db.js           # 数据库初始化
│   │   ├── middleware/auth.js
│   │   └── routes/         # auth.js / notes.js
│   ├── tests/integration.test.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React + Vite 前端
│   ├── src/
│   │   ├── App.jsx         # 主界面（登录 + 笔记 CRUD）
│   │   └── api.js          # API 封装
│   ├── Dockerfile          # 多阶段构建（Node → Nginx）
│   └── package.json
│
├── tests-e2e/              # Playwright E2E
├── .github/workflows/deploy.yml  # CI/CD
├── docker-compose.yml
└── README.md
```

---

## 三、第一天：本地跑起来（0 元练手）

### 3.1 环境准备清单

在你动手前，先确认电脑装了这些（**只装一次**）：

| 软件 | 作用 | 验证命令 |
|------|------|----------|
| Node.js ≥ 18 | 跑前后端 | `node -v` |
| npm | 装依赖 | `npm -v` |
| Docker Desktop | 容器化（本地练部署） | `docker -v` |
| Git | 版本管理 | `git -v` |

> 💡 没装 Docker Desktop 也没事，先用 `npm run dev` 跑，Docker 留到第三天。

### 3.2 启动后端

```bash
cd ai-cloud-notes/backend
cp .env.example .env        # 🔴 第一步：复制环境变量（很多人漏！）
npm ci                      # 装依赖
npm run dev                  # 启动开发模式（nodemon 热重载）
```

**验证**：浏览器打开 `http://localhost:3000/api/health`
→ 看到 `{ "status": "ok" }` 就成功 ✅

### 3.3 启动前端（新开一个终端）

```bash
cd ai-cloud-notes/frontend
npm ci
npm run dev                  # http://localhost:5173
```

**验证**：浏览器打开 `http://localhost:5173`
→ 看到「📝 AI 云笔记」登录页就成功 ✅

---

## 四、常见报错 · 排查手册（🔴 重点，明天一定会遇到）

> **遇到报错先别慌，也别直接丢给 AI**。按下面「看哪一步」自己读一遍。

### 4.1 启动类报错

| 报错信息（关键词） | 原因 | 解决命令 |
|-------------------|------|----------|
| `command not found: node` | Node 没装 | 去 nodejs.org 装 LTS |
| `EACCES` / 权限错误 | npm 权限问题 | `sudo chown -R $USER /usr/local/lib/node_modules` |
| `EADDRINUSE :3000` | **端口被占用** | 见下方「端口占用三连」 |
| `MODULE_NOT_FOUND` | 依赖没装 | `rm -rf node_modules && npm ci` |
| `JWT_SECRET is not defined` | **`.env` 没复制** | `cp .env.example .env` |

**端口占用三连**（背下来）：
```bash
# Mac / Linux
lsof -i :3000          # 查谁占了 3000
kill -9 <PID>          # 杀掉它

# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 4.2 数据库类报错

| 报错信息 | 原因 | 解决 |
|----------|------|------|
| `SQLITE_ERROR: no such table` | 表没初始化 | 确认 `db.js` 里的 `initDB()` 被执行 |
| `SQLITE_READONLY` | 数据库文件只读 | `chmod +w data/notes.db` |
| `ECONNREFUSED 127.0.0.1:3000` | 后端没启动 | 先跑后端再跑前端 |

### 4.3 Git 类报错（第三天重点）

| 报错信息 | 原因 | 解决 |
|----------|------|------|
| `CONFLICT (content)` | **合并冲突** | 见下方「冲突五步」 |
| `not a git repository` | 没 init | `git init` |
| `failed to push` | 没设 upstream | `git push -u origin <分支>` |
| 提交到了 wrong 分支 | 手滑 | `git reset --soft HEAD~1` 撤销 |

**冲突五步**（面试常考，亲手做）：
```bash
# 1. 看冲突文件
git status

# 2. 打开文件，找 <<<<<<<   =======   >>>>>>>

# 3. 手动删掉标记，保留正确代码

# 4. 标记已解决
git add <文件名>

# 5. 完成合并
git commit -m "merge: 解决冲突"
```

### 4.4 Docker 类报错（第三天重点）

| 报错信息 | 原因 | 解决 |
|----------|------|------|
| `ERROR: failed to solve` | Dockerfile 写错 | 看报错行号，`COPY` 路径对不对 |
| `port is already allocated` | **端口冲突** | 改 `docker-compose.yml` 的端口映射 |
| `Cannot connect to Docker daemon` | Docker 服务没起 | 打开 Docker Desktop 应用 |
| 容器 Exited(1) | **启动失败** | `docker compose logs <服务名>` |
| 数据重启后丢失 | **没挂 volume** | 加 `-v ./data:/app/data` |

**Docker 排错三板斧**（背下来）：
```bash
docker compose ps              # 1. 看状态（在不在跑）
docker compose logs -f backend # 2. 看日志（排错核心）
docker system df               # 3. 看磁盘（满了清垃圾）
docker system prune            #    清掉无用镜像/容器
```

---

## 五、Git 分支工作流（🔴 亲手练，别交 AI）

### 5.1 分支模型

```
main        ← 线上稳定（受保护，只准 PR 合入）
develop     ← 测试/联调
feature/xxx ← 功能开发（从 develop 拉）
hotfix/xxx  ← 紧急修复（从 main 拉）
```

### 5.2 标准流程（每个功能都走一遍）

```bash
# 1. 确保 develop 最新
git checkout develop && git pull

# 2. 拉功能分支 🔴
git checkout -b feature/login

# 3. 让 AI 写代码... 你审 git diff 🔴

# 4. 亲手提交（规范 message）🔴
git add .
git commit -m "feat(auth): 登录接口"
git push -u origin feature/login

# 5. 合到 develop（测试）
git checkout develop
git merge feature/login --no-ff
git push origin develop

# 6. 测试通过后合 main + 打标签 🔴
git checkout main
git merge develop --no-ff
git tag -a v1.0.0 -m "完成登录与笔记 CRUD"
git push origin main --tags
```

### 5.3 Commit Message 规范

- `feat:` 新功能
- `fix:` 修 bug
- `docs:` 文档
- `chore:` 构建/工具
- `test:` 测试
- `refactor:` 重构

---

## 六、测试（TDD + Playwright）

### 6.1 后端单元测试

```bash
cd backend
npm test                      # 跑 Jest + Supertest
```

**验证**：看到 `Tests: 15 passed` 之类就成功 ✅

### 6.2 E2E 测试（Playwright）

```bash
cd tests-e2e
npx playwright install         # 🔴 首次必须装浏览器
npx playwright test            # 跑 E2E
```

> ⚠️ **先启动前后端**（`npm run dev`）再跑 E2E，否则会连不上。

---

## 七、Docker 本地部署（第三天）

### 7.1 一键启动

```bash
cd ai-cloud-notes
docker compose up -d --build   # 构建 + 后台启动
```

### 7.2 验证

```bash
docker compose ps              # 前后端都在 Up 状态
curl http://localhost:3000/api/health   # 后端健康检查
# 浏览器打开 http://localhost:5173       # 前端
```

### 7.3 看日志 / 排错 🔴

```bash
docker compose logs -f backend # 实时看后端日志
docker compose logs -f frontend
```

### 7.4 停止 / 清理

```bash
docker compose down            # 停止并删容器（数据保留，因为挂了 volume）
docker compose down -v         # ⚠️ 连数据一起删（慎用）
```

---

## 八、服务器部署（第四天，约 100 元/年）

> 腾讯云 / 阿里云新人活动，2 核 2G 约 99 元/年，**系统选 Ubuntu 22.04**。

### 8.1 首次登录 + 装 Docker

```bash
ssh root@你的服务器IP

# 一键装 Docker
curl -fsSL https://get.docker.com | sh

# 验证
docker --version
```

### 8.2 部署流程（亲手执行）

```bash
# 1. 拉代码
git clone <你的仓库URL> && cd ai-cloud-notes

# 2. 配环境变量
cp backend/.env.example backend/.env
# 用 vim 或 nano 改 JWT_SECRET
nano backend/.env

# 3. 启动
docker compose up -d --build

# 4. 🔴 验证（必须自己做）
docker compose ps
docker compose logs -f backend
curl http://localhost:3000/api/health

# 5. 放端口（云控制台「安全组」也要放行 80/3000/5173）
ufw allow 80
ufw allow 3000
```

### 8.3 排错三板斧（背下来）

1. **服务挂了？** → `docker compose ps` 看状态 → `logs` 看错误
2. **端口不通？** → `curl localhost:端口` 本地测 → 查防火墙/安全组
3. **磁盘满了？** → `df -h` 看磁盘 → `docker system prune` 清垃圾

---

## 九、CI/CD（GitHub Actions，第五天）

**目标**：`push develop` → 自动跑测试；`push main` → 自动部署到服务器。

### 9.1 配一次（终身受用）

```bash
# 1. 本地生成 SSH 密钥
ssh-keygen -t ed25519 -f ~/.ssh/github_actions

# 2. 公钥加到服务器
ssh-copy-id -i ~/.ssh/github_actions.pub root@服务器IP

# 3. 私钥加到 GitHub Secrets（Settings → Secrets）
#    SERVER_IP       = 你的服务器 IP
#    SERVER_USER     = root
#    SSH_PRIVATE_KEY = 私钥全文（cat ~/.ssh/github_actions）
#    JWT_SECRET      = 随机字符串
```

### 9.2 工作流文件已就绪

`.github/workflows/deploy.yml` 已写好：
- `push develop` → 跑 Jest 测试 + 前端构建
- `push main` → 测试过 → SSH 部署 → 健康检查 → 打印日志

---

## 十、4 周练习计划

| 周次 | 重点 | 验收标准 |
|------|------|---------|
| **第 1 周** | Git 分支 + commit 规范 | 亲手走 `feature → develop → main`，打 3 个 Tag |
| **第 2 周** | AI 写代码 + 你审 + TDD/Playwright | 每个功能有测试，合 develop 前全绿 |
| **第 3 周** | Docker + 本地部署 | `docker compose up` 跑通，会看日志排错 |
| **第 4 周** | 服务器 + CI/CD | push main 自动部署，线上能用 IP 访问 |

---

## 十一、故意练「排错」的小游戏 🎮

> 跑通之后，**故意制造错误**，练「看报错」的能力：

| 玩法 | 怎么做 | 你会学到 |
|------|--------|---------|
| 删掉 `.env` | `rm backend/.env` 再启动 | 环境变量缺失的报错 |
| 改错端口 | 把 3000 改成 9999 | 端口配置概念 |
| 注释掉 db.initDB() | 看测试报什么 | 数据库初始化流程 |
| 删掉 volume | `docker compose down -v` 再启动 | 数据持久化概念 |
| 制造 Git 冲突 | 两个分支改同一行 | 冲突解决流程 |

---

## 十二、求职加分 · 简历写法

做完这个项目，简历可以写：

> - 独立设计并交付「AI 云笔记」全栈应用（React + Vite / Express + SQLite）
> - 采用 Git Flow 分支管理，规范 commit message，独立完成 develop/main 合并与版本发布
> - 基于 Docker / Docker Compose 容器化部署，配置 GitHub Actions CI/CD 实现自动测试与部署
> - 编写 Jest 集成测试 + Playwright E2E 测试，保障交付质量
> - 具备服务器日志排查、端口/进程/磁盘诊断能力

---

## 十三、明天开练 · 行动清单 ✅

> 明天打开 Codex，按顺序勾选：

- [ ] 1. 确认 Node / npm / Git / Docker Desktop 已装（`node -v` 等）
- [ ] 2. `cd backend` → `cp .env.example .env` → `npm ci` → `npm run dev`
- [ ] 3. 浏览器打开 `http://localhost:3000/api/health` 看到 ok
- [ ] 4. 新终端 `cd frontend` → `npm ci` → `npm run dev`
- [ ] 5. 浏览器打开 `http://localhost:5173` 能注册/登录/写笔记
- [ ] 6. `cd backend` → `npm test` 看到测试全绿
- [ ] 7. 初始化 Git：`git init` → `main` + `develop` 分支建好
- [ ] 8. 走一遍 `feature → develop → main`，打一个 `v0.1.0` 标签
- [ ] 9. `docker compose up -d --build` 跑通
- [ ] 10. 故意删 `.env` / 改端口，练排错

---

> 🎯 **记住**：你不需要背下所有命令。**你只需要做到——AI 给的命令，你能看懂它在干什么；出事了，你知道去哪里查。**
>
> 每一条命令，**先自己敲一遍**，别让 AI 代劳。3 个项目下来，部署对你来说就是「常规操作」了。

🎉 加油，明天开搞！
