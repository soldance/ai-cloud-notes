/**
 * integration.test.js - 后端集成测试（TDD）
 * 用 supertest 模拟 HTTP 请求，验证接口正确性
 *
 * ⚠️ 数据库隔离：这里不再手动 DELETE 数据表。
 * tests/setup.js 会把 DB_PATH 指向 data/test.db（独立测试库），
 * 每次跑测试前整个文件被删除重建，所以这里天然就是干净库，
 * 你本地 data/notes.db 里的真实笔记不会被碰。
 */
const request = require('supertest');
const app = require('../src/server');

let authToken = '';

describe('认证流程', () => {
  test('注册新用户 → 返回 token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: '123456' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    authToken = res.body.token;
  });

  test('重复注册 → 返回 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: '123456' });

    expect(res.status).toBe(409);
  });

  test('登录 → 返回 token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('错误密码 → 返回 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});

describe('笔记 CRUD', () => {
  let noteId = '';

  test('新建笔记 → 201', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '我的第一篇笔记', content: 'Hello World', tags: ['学习', 'AI'] });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('我的第一篇笔记');
    expect(res.body.tags).toEqual(['学习', 'AI']);
    noteId = res.body.id;
  });

  test('未带 token → 401', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(401);
  });

  test('获取笔记列表 → 200', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('搜索笔记 → 按关键词过滤', async () => {
    const res = await request(app)
      .get('/api/notes?search=Hello')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some(n => n.title.includes('Hello') || n.content.includes('Hello'))).toBe(true);
  });

  test('更新笔记 → 200', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '修改后的标题', is_favorite: true });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('修改后的标题');
    expect(res.body.is_favorite).toBe(true);
  });

  test('删除笔记 → 204', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });
});

describe('健康检查', () => {
  test('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
