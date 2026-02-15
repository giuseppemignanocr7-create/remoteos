const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const auth = {
  register: (email: string, password: string, full_name: string) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password_hash: password, full_name }) }),
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<any>('/auth/me'),
  refresh: (refreshToken: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),
};

// Devices
export const devices = {
  list: () => request<any[]>('/devices'),
  create: (data: any) => request<any>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  revoke: (id: string) => request<any>(`/devices/${id}`, { method: 'DELETE' }),
};

// Sessions
export const sessions = {
  list: () => request<any[]>('/sessions'),
  create: (data: any) => request<any>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  end: (id: string) => request<any>(`/sessions/${id}/end`, { method: 'PATCH' }),
};

// Commands
export const commands = {
  create: (data: any) => request<any>('/commands', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => request<any>(`/commands/${id}`),
  progress: (id: string) => request<any[]>(`/commands/${id}/progress`),
  bySession: (sessionId: string) => request<any[]>(`/commands/session/${sessionId}`),
  confirm: (id: string, deviceId: string, approved: boolean) =>
    request<any>(`/commands/${id}/confirm`, { method: 'PATCH', body: JSON.stringify({ device_id: deviceId, approved }) }),
  cancel: (id: string) => request<any>(`/commands/${id}/cancel`, { method: 'PATCH' }),
};

// Macros
export const macros = {
  list: () => request<any[]>('/macros'),
  get: (id: string) => request<any>(`/macros/${id}`),
  create: (data: any) => request<any>('/macros', { method: 'POST', body: JSON.stringify(data) }),
  execute: (id: string, data: any) => request<any>(`/macros/${id}/execute`, { method: 'POST', body: JSON.stringify(data) }),
  runStatus: (runId: string) => request<any>(`/macros/runs/${runId}`),
};

// Notifications
export const notifications = {
  list: () => request<any[]>('/notifications'),
  markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
};

// Audit
export const audit = {
  timeline: (limit = 50, offset = 0) => request<any[]>(`/audit/timeline?limit=${limit}&offset=${offset}`),
  verify: () => request<any>('/audit/verify'),
};

// Health
export const health = {
  check: () => request<any>('/health'),
  ready: () => request<any>('/health/ready'),
};
