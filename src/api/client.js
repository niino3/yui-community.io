/**
 * バックエンド API クライアント
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://yui-communityio-production.up.railway.app'

// マルチテナント対応：現在のコミュニティスラグを保持
let currentCommunitySlug = null

function getToken() {
  return localStorage.getItem('yui_api_token')
}

function setToken(token) {
  if (token) {
    localStorage.setItem('yui_api_token', token)
  } else {
    localStorage.removeItem('yui_api_token')
  }
}

export function isAuthenticated() {
  return !!getToken()
}

export function setAuthToken(token) {
  setToken(token)
}

export function clearAuth() {
  setToken(null)
  localStorage.removeItem('yui_user')
}

export function getStoredUser() {
  try {
    const json = localStorage.getItem('yui_user')
    return json ? JSON.parse(json) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  localStorage.setItem('yui_user', user ? JSON.stringify(user) : '')
}

async function request(path, options = {}) {
  const url = `${API_URL.replace(/\/$/, '')}/api${path}`
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  // マルチテナント対応：X-Community-Slug ヘッダーを追加
  if (currentCommunitySlug) {
    headers['X-Community-Slug'] = currentCommunitySlug
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    clearAuth()
  }
  if (!res.ok) {
    const err = new Error(res.statusText || 'API Error')
    err.status = res.status
    try {
      err.body = await res.json()
    } catch {
      err.body = null
    }
    throw err
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),

  // マルチテナント対応：コミュニティスラグの設定・取得
  setCommunitySlug: (slug) => {
    currentCommunitySlug = slug
  },
  getCommunitySlug: () => currentCommunitySlug,

  auth: {
    nonce: (walletAddress) => api.post('/auth/nonce', { wallet_address: walletAddress }),
    wallet: (walletAddress, message, signature) =>
      api.post('/auth/wallet', { wallet_address: walletAddress, message, signature }),
    logout: () => api.post('/auth/logout'),
  },
  users: {
    me: () => api.get('/users/me'),
  },
  communities: {
    list: () => api.get('/communities'),
    current: () => api.get('/communities/current'),
  },
  platform: {
    communities: {
      list: () => api.get('/platform/communities'),
      get: (id) => api.get(`/platform/communities/${id}`),
      create: (data) => api.post('/platform/communities', data),
      update: (id, data) => api.patch(`/platform/communities/${id}`, data),
      delete: (id) => {
        return fetch(`${import.meta.env.VITE_API_URL || 'https://yui-communityio-production.up.railway.app'}/api/platform/communities/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('yui_api_token')}`,
          },
        }).then(res => res.json())
      },
    },
    stats: () => api.get('/platform/stats'),
  },
  tasks: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString()
      return api.get('/tasks' + (qs ? `?${qs}` : ''))
    },
    get: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    assign: (id) => api.patch(`/tasks/${id}/assign`, {}),
    complete: (id) => api.patch(`/tasks/${id}/complete`, {}),
    approve: (id) => api.patch(`/tasks/${id}/approve`, {}),
  },
  transactions: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString()
      return api.get('/transactions' + (qs ? `?${qs}` : ''))
    },
    record: (data) => api.post('/transactions/record', data),
  },
  equipment: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString()
      return api.get('/equipment' + (qs ? `?${qs}` : ''))
    },
    get: (id) => api.get(`/equipment/${id}`),
    reserve: (id, data) => api.post(`/equipment/${id}/reserve`, data),
    return: (id) => api.patch(`/equipment/${id}/return`, {}),
  },
  earthCare: {
    list: (params) => {
      const qs = new URLSearchParams(params).toString()
      return api.get('/earth-care' + (qs ? `?${qs}` : ''))
    },
    get: (id) => api.get(`/earth-care/${id}`),
    create: (data) => api.post('/earth-care', data),
    approve: (id) => api.post(`/earth-care/${id}/approve`, {}),
  },
  notifications: {
    list: () => api.get('/notifications'),
    unreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`, {}),
    markAllAsRead: () => api.post('/notifications/read-all'),
  },
}

export default api
