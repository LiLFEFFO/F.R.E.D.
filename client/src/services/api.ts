const API_BASE = '/api';

async function request(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('fred_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
    updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    upgradeElite: (password: string) => request('/auth/upgrade-elite', { method: 'POST', body: JSON.stringify({ password }) }),
  },
  championships: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      return request(`/championships?${q}`);
    },
    get: (id: string) => request(`/championships/${id}`),
    create: (data: any) => request('/championships', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/championships/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/championships/${id}`, { method: 'DELETE' }),
    conclude: (id: string) => request(`/championships/${id}/conclude`, { method: 'PUT' }),
    standings: (id: string) => request(`/championships/${id}/standings`),
    statistics: (id: string) => request(`/championships/${id}/statistics`),
    updateScoring: (id: string, data: any) => request(`/championships/${id}/scoring`, { method: 'PUT', body: JSON.stringify(data) }),
    titleScenarios: (id: string) => request(`/championships/${id}/title-scenarios`),
  },
  drivers: {
    list: (params?: { championship_id?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.championship_id) q.set('championship_id', params.championship_id);
      if (params?.search) q.set('search', params.search);
      return request(`/drivers?${q}`);
    },
    get: (id: string) => request(`/drivers/${id}`),
    create: (data: any) => request('/drivers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/drivers/${id}`, { method: 'DELETE' }),
  },
  teams: {
    list: (championship_id?: string) => request(`/teams${championship_id ? `?championship_id=${championship_id}` : ''}`),
    create: (data: any) => request('/teams', { method: 'POST', body: JSON.stringify({ ...data, reserve_driver_id: data.reserve_driver_id || null }) }),
    update: (id: string, data: any) => request(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/teams/${id}`, { method: 'DELETE' }),
  },
  races: {
    list: (championship_id?: string) => request(`/races${championship_id ? `?championship_id=${championship_id}` : ''}`),
    get: (id: string) => request(`/races/${id}`),
    create: (data: any) => request('/races', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/races/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/races/${id}`, { method: 'DELETE' }),
    submitResults: (id: string, results: any[]) =>
      request(`/races/${id}/results`, { method: 'POST', body: JSON.stringify({ results }) }),
    submitSprintResults: (id: string, results: any[]) =>
      request(`/races/${id}/sprint-results`, { method: 'POST', body: JSON.stringify({ results }) }),
    export: (id: string, format: string) => request(`/races/${id}/export?format=${format}`),
    reopen: (id: string) => request(`/races/${id}/reopen`, { method: 'PUT' }),
  },
  admin: {
    myChampionships: () => request('/admin/my-championships'),
    dashboard: () => request('/admin/dashboard'),
    users: (search?: string) => request(`/admin/users${search ? `?search=${search}` : ''}`),
    setUserRole: (userId: string, role: string) =>
      request(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  },
  notifications: {
    list: () => request('/notifications'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  },
  news: {
    list: () => request('/news'),
    get: (id: string) => request(`/news/${id}`),
    create: (data: any) => request('/news', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/news/${id}`, { method: 'DELETE' }),
    listAll: () => request('/news/all'),
  },
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('fred_token');
    return fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    });
  },
};
