/**
 * server.js - 后端入口
 * 启动 Express 服务，挂载路由
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// 确保数据目录存在
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 健康检查（部署后用来验证服务是否存活）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

// 错误处理
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动
app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
});

module.exports = app; // 供测试使用
