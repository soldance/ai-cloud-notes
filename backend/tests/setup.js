/**
 * tests/setup.js - 测试环境隔离（🔴 防止 npm test 清空你的真实笔记）
 *
 * 问题：集成测试需要「干净的数据库」，原来的做法是直接在 beforeAll 里
 *       DELETE FROM users / notes。如果 db.js 连的是 data/notes.db，
 *       你本地辛苦写的笔记会被测试清空。
 *
 * 解决：在 db.js 被 require 之前，把 DB_PATH 指向独立的测试库。
 *       db.js 第 8 行是 `process.env.DB_PATH || 默认路径`，所以这里覆盖即可。
 *
 * 执行时机：由 jest.config.js 的 setupFiles 保证——早于测试文件加载。
 */
const path = require('path');
const fs = require('fs');

// 1. 确保 data 目录存在（db.js 连接时会用到）
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// 2. 每次测试跑之前删掉旧的测试库，保证从零开始
const testDbPath = path.join(dataDir, 'test.db');
for (const suffix of ['', '-journal', '-wal', '-shm']) {
  fs.rmSync(testDbPath + suffix, { force: true });
}

// 3. 指向测试库（必须在任何 require('../src/db') 之前设置）
process.env.DB_PATH = testDbPath;

// 4. 固定 JWT_SECRET，避免 CI 上没 .env 导致签名/校验用的 secret 不一致
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// 5. 让代码里可以判断「我在测试环境」
process.env.NODE_ENV = 'test';
