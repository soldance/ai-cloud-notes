import React, { useState, useEffect, useCallback } from 'react';
import { authAPI, notesAPI } from './api';

/**
 * App.jsx - 主应用组件
 * 功能：注册/登录 → 笔记列表/搜索/新建/编辑/删除/收藏
 */
export default function App() {
  // ===== 状态 =====
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(''); // '' = 不按标签筛选
  const [editingNote, setEditingNote] = useState(null); // null = 新建模式
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== 判断是否已登录 =====
  const isLoggedIn = !!token;

  // ===== 加载笔记列表 =====
  const loadNotes = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (activeTag) params.tag = activeTag;
      const res = await notesAPI.list(params);
      setNotes(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, search, activeTag]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // ===== 注册 =====
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authAPI.register(username, password);
      localStorage.setItem('token', res.token);
      setToken(res.token);
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== 登录 =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authAPI.login(username, password);
      localStorage.setItem('token', res.token);
      setToken(res.token);
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== 登出 =====
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setNotes([]);
  };

  // ===== 保存笔记（新建/更新） =====
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, { title, content, tags: tagArray });
      } else {
        await notesAPI.create({ title, content, tags: tagArray });
      }
      // 重置表单 + 刷新列表
      resetForm();
      loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== 编辑笔记 =====
  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(', ') || '');
  };

  // ===== 删除笔记 =====
  const handleDelete = async (id) => {
    if (!confirm('确定删除这条笔记吗？')) return;
    try {
      await notesAPI.delete(id);
      loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== 切换收藏 =====
  const handleToggleFavorite = async (note) => {
    try {
      await notesAPI.update(note.id, { is_favorite: !note.is_favorite });
      loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== 按标签筛选 =====
  // 点击笔记上的标签 → 列表只显示含该标签的笔记
  // 再次点击同一个标签 → 取消筛选（当作开关用，避免用户找不到"清除"入口）
  const handleTagClick = (tag) => {
    setActiveTag(prev => (prev === tag ? '' : tag));
  };

  const clearTagFilter = () => setActiveTag('');

  // ===== 重置表单 =====
  const resetForm = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTags('');
  };

  // ===== 登录/注册界面 =====
  if (!isLoggedIn) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h1 style={styles.logo}>📝 AI 云笔记</h1>
          <p style={styles.subtitle}>你的知识，随时记录</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="text"
              data-testid="username-input"
              placeholder="用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              data-testid="password-input"
              placeholder="密码（至少6位）"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" data-testid="login-btn" style={styles.primaryBtn}>登录</button>
          </form>

          <div style={styles.divider}>— 或 —</div>

          <form onSubmit={handleRegister} style={styles.form}>
            <button type="submit" data-testid="register-btn" style={styles.secondaryBtn}>注册新账号</button>
          </form>
        </div>
      </div>
    );
  }

  // ===== 主界面 =====
  return (
    <div style={styles.app}>
      {/* 顶栏 */}
      <header style={styles.header}>
        <h1 style={styles.headerLogo}>📝 AI 云笔记</h1>
        <div style={styles.headerRight}>
          <input
            type="text"
            data-testid="search-input"
            placeholder="🔍 搜索笔记..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          <button onClick={handleLogout} data-testid="logout-btn" style={styles.logoutBtn}>登出</button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.main}>
        {/* 左侧：笔记列表 */}
        <aside style={styles.sidebar}>
          <button onClick={resetForm} data-testid="new-note-btn" style={styles.newBtn}>
            ➕ 新建笔记
          </button>

          {/* 标签筛选状态提示条（仅在筛选时出现） */}
          {activeTag && (
            <div style={styles.filterBar} data-testid="tag-filter-bar">
              <span style={styles.filterBarText}>
                标签：<strong>{activeTag}</strong>
              </span>
              <button
                onClick={clearTagFilter}
                data-testid="clear-tag-filter"
                style={styles.filterClearBtn}
              >
                清除 ✕
              </button>
            </div>
          )}

          <div style={styles.noteList}>
            {loading && <p style={styles.emptyTip}>加载中...</p>}
            {!loading && notes.length === 0 && (
              <p style={styles.emptyTip} data-testid="empty-tip">还没有笔记，点击上方新建 ✨</p>
            )}
            {notes.map(note => (
              <div
                key={note.id}
                data-testid="note-item"
                style={{
                  ...styles.noteItem,
                  ...(editingNote?.id === note.id ? styles.noteItemActive : {}),
                }}
                onClick={() => handleEdit(note)}
              >
                <div
                  style={styles.noteTitle}
                  data-testid="note-title"
                  onClick={e => { e.stopPropagation(); handleEdit(note); }}
                  title="点击编辑这条笔记"
                >
                  {note.is_favorite ? '⭐ ' : ''}
                  {note.title}
                </div>
                <div style={styles.notePreview}>
                  {note.content.slice(0, 50) || '（空内容）'}
                </div>
                {note.tags?.length > 0 && (
                  <div style={styles.tagList}>
                    {note.tags.map((tag, i) => (
                      <span
                        key={i}
                        data-testid="note-tag"
                        title={`只看「${tag}」标签的笔记`}
                        onClick={e => { e.stopPropagation(); handleTagClick(tag); }}
                        style={{
                          ...styles.tag,
                          ...(activeTag === tag ? styles.tagActive : {}),
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={styles.noteActions}>
                  <span
                    data-testid="favorite-btn"
                    onClick={e => { e.stopPropagation(); handleToggleFavorite(note); }}
                    style={styles.actionIcon}
                  >
                    {note.is_favorite ? '⭐' : '☆'}
                  </span>
                  <span
                    data-testid="delete-btn"
                    onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                    style={styles.actionIcon}
                  >
                    🗑️
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 右侧：编辑区 */}
        <main style={styles.editor}>
          <form onSubmit={handleSave} style={styles.editorForm}>
            <input
              type="text"
              data-testid="title-input"
              placeholder="标题"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={styles.titleInput}
            />
            <input
              type="text"
              data-testid="tags-input"
              placeholder="标签（逗号分隔，如：学习, AI, 项目）"
              value={tags}
              onChange={e => setTags(e.target.value)}
              style={styles.tagsInput}
            />
            <textarea
              data-testid="content-input"
              placeholder="开始写作...（支持 Markdown）"
              value={content}
              onChange={e => setContent(e.target.value)}
              style={styles.contentInput}
            />
            <div style={styles.editorActions}>
              <button type="submit" data-testid="save-btn" style={styles.saveBtn}>
                {editingNote ? '💾 更新' : '✨ 创建'}
              </button>
              {editingNote && (
                <button type="button" onClick={resetForm} data-testid="cancel-btn" style={styles.cancelBtn}>
                  取消
                </button>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

// ===== 内联样式（练手项目简化，实际可用 Tailwind/CSS Modules） =====
const styles = {
  // 认证页
  authContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  authCard: { background: '#fff', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.3)' },
  logo: { textAlign: 'center', fontSize: 28, margin: 0 },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  primaryBtn: { padding: 12, background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' },
  secondaryBtn: { padding: 12, background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' },
  divider: { textAlign: 'center', margin: 16, color: '#aaa', fontSize: 12 },

  // 主应用
  app: { minHeight: '100vh', background: '#f8f9fa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 },
  headerLogo: { fontSize: 20, margin: 0 },
  headerRight: { display: 'flex', gap: 12, alignItems: 'center' },
  searchInput: { padding: 8, border: '1px solid #ddd', borderRadius: 8, width: 240 },
  logoutBtn: { padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' },

  main: { display: 'flex', height: 'calc(100vh - 60px)' },
  sidebar: { width: 300, background: '#fff', borderRight: '1px solid #eee', padding: 16, overflowY: 'auto' },
  newBtn: { width: '100%', padding: 12, background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 16 },

  // 标签筛选提示条
  filterBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', marginBottom: 12, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8 },
  filterBarText: { fontSize: 12, color: '#4338ca' },
  filterClearBtn: { background: 'transparent', border: 'none', color: '#4338ca', fontSize: 12, cursor: 'pointer', padding: '2px 6px', borderRadius: 4 },

  noteList: { display: 'flex', flexDirection: 'column', gap: 8 },
  noteItem: { padding: 12, border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', transition: 'all .2s' },
  noteItemActive: { borderColor: '#667eea', background: '#f0f4ff' },
  noteTitle: { fontWeight: 600, fontSize: 14, marginBottom: 4, cursor: 'pointer' },
  notePreview: { fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tagList: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 },
  tag: { fontSize: 11, background: '#eef2ff', color: '#667eea', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' },
  tagActive: { background: '#667eea', color: '#fff', fontWeight: 600 },
  noteActions: { display: 'flex', gap: 8, marginTop: 6 },
  actionIcon: { cursor: 'pointer', fontSize: 14 },

  editor: { flex: 1, padding: 24, overflowY: 'auto' },
  editorForm: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800, margin: '0 auto' },
  titleInput: { fontSize: 24, fontWeight: 700, border: 'none', outline: 'none', padding: 12, background: 'transparent' },
  tagsInput: { padding: 8, border: '1px solid #eee', borderRadius: 8, fontSize: 13 },
  contentInput: { minHeight: 500, padding: 16, border: '1px solid #eee', borderRadius: 12, fontSize: 15, lineHeight: 1.8, resize: 'vertical', fontFamily: 'inherit' },
  editorActions: { display: 'flex', gap: 12 },
  saveBtn: { padding: '10px 24px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  cancelBtn: { padding: '10px 24px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' },

  error: { margin: 12, padding: 12, background: '#fee', color: '#c00', borderRadius: 8, fontSize: 13 },
  emptyTip: { textAlign: 'center', color: '#aaa', padding: 40 },
};

// 确保 React 被正确引用（JSX 需要）
void React;
