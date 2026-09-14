# AGENTS.md · ai-cloud-notes

本文件给 AI 编程助手（Codex / Cursor / DSH 等）提供项目级上下文。
**个人交接笔记见 `HANDOFF.md`（本地忽略，不进仓库）。**

## 项目概况

AI 云笔记：支持 Markdown 的云笔记应用。
React 18 + Vite 5 前端，Express 4 + SQLite 后端，Docker Compose 部署，GitHub Actions CI/CD。

## 常用命令

```bash
# 环境（首次）
cd backend && cp .env.example .env && npm ci
cd frontend && npm ci

# 开发
cd backend  && npm run dev     # 后端 → http://localhost:3000
cd frontend && npm run dev     # 前端 → http://localhost:5173

# 测试
cd backend  && npm test        # Jest + Supertest，期望 11 passed（不占端口）
cd tests-e2e && npx playwright test    # 需前后端都在跑，期望 1 passed

# 健康检查
curl http://localhost:3000/api/health
```

> ⚠️ 不要主动长期启动 `npm run dev`，用户会自己跑，避免端口冲突。

## 硬性约束（违反会出问题）

| 约束 | 原因 |
|---|---|
| 装依赖用 `npm ci`，**不用** `npm install` | 仓库已提交 lockfile，`npm ci` 保证可复现 |
| E2E 定位一律用 `data-testid` | `App.jsx` 用内联样式对象，DOM 里没有 class 名；文本定位会同时命中搜索结果与编辑区的同名文本，触发 strict mode 报错 |
| 不要改 `server.js` 的 `require.main === module` 守卫 | 删了 `npm test` 会抢 3000 端口 |
| 不要删 `.npmrc` | 删了 `better-sqlite3` 在 Node 22 上装不上（无本地编译工具链） |
| 不要提交 `data/*.db` | 已 gitignore，且是用户数据 |
| 改 `db.js` 时确认 `initDB()` 被调用 | 漏调用会 `SQLITE_ERROR: no such table` |
| 不要改 `docker-compose.yml` 的端口映射 | 文档与 CI 依赖 3000 / 5173 |

## 测试架构要点

**测试库隔离**：`backend/jest.config.js` 用 `setupFiles`（不是 `setupFilesAfterEach`）
加载 `tests/setup.js`，后者在 `src/db.js` 建立连接**之前**把 `DB_PATH` 覆盖为
`data/test.db` 并删除旧文件。

> 时机是关键：`setupFiles` 早于测试文件的 `require`，所以能改到 `DB_PATH`；
> `setupFilesAfterEach` 那时 `db.js` 已执行完，改了也没用。

**E2E 需前后端同时运行**，`playwright.config.js` 的 `webServer` 是注释掉的。

## 已知缺陷（修复前先和用户确认）

- `frontend/Dockerfile` 用 Nginx 托管静态文件，但**没配 `/api` 反向代理**，
  容器化后前端接口请求会 404。需补 `nginx.conf` 的
  `location /api { proxy_pass http://backend:3000; }`
- 前端标签筛选无 UI 入口（后端 `GET /api/notes?tag=xxx` 已支持）
- 前端错误提示是顶部红色横条，可改 toast

## Git 工作流

```
main         ← 线上稳定（默认分支）
develop      ← 集成分支，功能都合到这里
feature/xxx  ← 从 develop 拉
```

**遵守全局 `~/.dsh/AGENTS.md` 的 Git 提交规范**（提交前核对暂存区、
不 `git add -A`、不替用户决定提交内容）。

- **Git 动作交回用户**：用户正在通过本项目练习 Git，commit / merge / tag / push
  原则上由用户亲手执行；AI 只解释命令含义，除非用户明确要求代劳
- 合并用 `--no-ff` 保留分支痕迹
- 发版打附注标签：`git tag -a v0.x.0 -m "..."`
