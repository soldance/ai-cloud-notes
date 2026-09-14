/**
 * api.js - 封装所有后端 API 调用
 * 统一处理 token 注入、错误处理
 */

const API_BASE = '/api'; // 开发环境走 Vite 代理，生产环境同源

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  if (response.status === 204) return null;
  return response.json();
}

// ===== 认证 API =====
export const authAPI = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

// ===== 笔记 API =====
export const notesAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notes${query ? `?${query}` : ''}`);
  },

  get: (id) => request(`/notes/${id}`),

  create: (data) =>
    request('/notes', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) =>
    request(`/notes/${id}`, { method: 'DELETE' }),
};
