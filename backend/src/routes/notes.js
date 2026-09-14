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

/**
 * 把数据库里的一行 note 转成 API 响应格式
 * - tags：SQLite 存的是 JSON 字符串，要转回数组
 * - is_favorite：SQLite 没有布尔类型，存的是 0/1，
 *   要转成真正的布尔值，否则前端拿到数字、测试断言 true 会失败
 */
function toNoteResponse(row) {
  return {
    ...row,
    tags: JSON.parse(row.tags),
    is_favorite: !!row.is_favorite,
  };
}

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

  res.json({ data: notes.map(toNoteResponse) });
});

// 详情
router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);

  if (!note) return res.status(404).json({ error: '笔记不存在' });
  res.json(toNoteResponse(note));
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
  res.status(201).json(toNoteResponse(note));
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
  res.json(toNoteResponse(note));
});

// 删除
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);

  if (result.changes === 0) return res.status(404).json({ error: '笔记不存在' });
  res.status(204).end();
});

module.exports = router;
