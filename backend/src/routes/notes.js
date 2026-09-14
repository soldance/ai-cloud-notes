/**
 * notes.js - 笔记 CRUD 路由
 * GET    /api/notes          - 列表（支持搜索、标签筛选）
 * GET    /api/notes/:id      - 详情
 * POST   /api/notes          - 新建
 * PUT    /api/notes/:id      - 更新
 * DELETE /api/notes/:id      - 删除
 */
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

// 所有笔记接口都需要登录
router.use(authMiddleware);

// 列表 + 搜索
router.get('/', (req, res) => {
  const { search, tag, favorite } = req.query;
  let sql = 'SELECT * FROM notes WHERE user_id = ?';
  const params = [req.userId];

  if (search) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (tag) {
    sql += ' AND tags LIKE ?';
    params.push(`%"${tag}"%`);
  }
  if (favorite === 'true') {
    sql += ' AND is_favorite = 1';
  }

  sql += ' ORDER BY updated_at DESC';

  const notes = db.prepare(sql).all(...params);
  // 把 tags 从 JSON 字符串转回数组
  notes.forEach(n => { n.tags = JSON.parse(n.tags); });

  res.json({ data: notes });
});

// 详情
router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!note) return res.status(404).json({ error: '笔记不存在' });
  note.tags = JSON.parse(note.tags);
  res.json(note);
});

// 新建
router.post('/', (req, res) => {
  const { title, content, tags } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO notes (id, user_id, title, content, tags)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.userId, title, content || '', JSON.stringify(tags || []));

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  note.tags = JSON.parse(note.tags);
  res.status(201).json(note);
});

// 更新
router.put('/:id', (req, res) => {
  const { title, content, tags, is_favorite } = req.body;
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!existing) return res.status(404).json({ error: '笔记不存在' });

  db.prepare(`
    UPDATE notes SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      tags = COALESCE(?, tags),
      is_favorite = COALESCE(?, is_favorite),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    title, content,
    tags ? JSON.stringify(tags) : null,
    is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
    req.params.id, req.userId
  );

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  note.tags = JSON.parse(note.tags);
  res.json(note);
});

// 删除
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);

  if (result.changes === 0) return res.status(404).json({ error: '笔记不存在' });
  res.status(204).end();
});

module.exports = router;
