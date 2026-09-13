const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('accessToken') || '';
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken') || '';
}

export function setSession({ accessToken, refreshToken, user } = {}) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

let refreshPromise = null;

async function tryRefresh() {
  if (!getRefreshToken()) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() })
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data?.accessToken) {
          setSession(data.data);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new ApiError('Can\u2019t reach the server. Check your connection and try again.', 0);
  }

  if (res.status === 401 && auth && retry && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, { method, body, auth, retry: false });
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.errors[0].message || data?.message || data?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Users
  getUser: (username) => request(`/users/${encodeURIComponent(username)}`),
  updateProfile: (payload) => request('/users/profile', { method: 'PUT', body: payload }),
  getUserStats: (username) => request(`/users/${encodeURIComponent(username)}/stats`),
  getUserPosts: (username, { limit = 10, offset = 0 } = {}) =>
    request(`/users/${encodeURIComponent(username)}/posts?limit=${limit}&offset=${offset}`),
  getUserComments: (username, { limit = 10, offset = 0 } = {}) =>
    request(`/users/${encodeURIComponent(username)}/comments?limit=${limit}&offset=${offset}`),

  // Communities
  createCommunity: (payload) => request('/communities', { method: 'POST', body: payload }),
  getCommunities: ({ limit = 20, offset = 0 } = {}) =>
    request(`/communities?limit=${limit}&offset=${offset}`, { auth: false }),
  getCommunityById: (id) => request(`/communities/${id}`, { auth: false }),
  getCommunityByName: (name) => request(`/communities/name/${encodeURIComponent(name)}`, { auth: false }),
  searchCommunities: (q, { limit = 10 } = {}) =>
    request(`/communities/search?q=${encodeURIComponent(q)}&limit=${limit}`, { auth: false }),
  joinCommunity: (id) => request(`/communities/${id}/join`, { method: 'POST' }),
  leaveCommunity: (id) => request(`/communities/${id}/leave`, { method: 'POST' }),
  getUserCommunities: (userId) => request(`/communities/user/${userId}`),
  getCommunityMembers: (id, { limit = 20, offset = 0 } = {}) =>
    request(`/communities/${id}/members?limit=${limit}&offset=${offset}`, { auth: false }),
  updateCommunity: (id, payload) => request(`/communities/${id}`, { method: 'PUT', body: payload }),

  // Posts
  createPost: (payload) => request('/posts', { method: 'POST', body: payload }),
  getFeed: ({ sortBy = 'hot', limit = 20, offset = 0 } = {}) =>
    request(`/posts?sortBy=${sortBy}&limit=${limit}&offset=${offset}`, { auth: false }),
  getPost: (id) => request(`/posts/${id}`, { auth: false }),
  getCommunityPosts: (communityId, { sortBy = 'hot', limit = 20, offset = 0 } = {}) =>
    request(`/posts/community/${communityId}?sortBy=${sortBy}&limit=${limit}&offset=${offset}`, { auth: false }),
  searchPosts: (q, { limit = 10, offset = 0 } = {}) =>
    request(`/posts/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`, { auth: false }),
  updatePost: (id, payload) => request(`/posts/${id}`, { method: 'PUT', body: payload }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),

  // Comments
  createComment: (payload) => request('/comments', { method: 'POST', body: payload }),
  getPostComments: (postId, { sortBy = 'best', limit = 20, offset = 0 } = {}) =>
    request(`/comments/post/${postId}?sortBy=${sortBy}&limit=${limit}&offset=${offset}`, { auth: false }),
  getCommentReplies: (commentId, { limit = 10, offset = 0 } = {}) =>
    request(`/comments/${commentId}/replies?limit=${limit}&offset=${offset}`, { auth: false }),
  updateComment: (id, payload) => request(`/comments/${id}`, { method: 'PUT', body: payload }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  // Votes
  vote: ({ postId, commentId, voteType }) =>
    request('/votes', { method: 'POST', body: postId ? { postId, voteType } : { commentId, voteType } }),
  removeVote: ({ postId, commentId }) =>
    request('/votes', { method: 'DELETE', body: postId ? { postId } : { commentId } })
};
