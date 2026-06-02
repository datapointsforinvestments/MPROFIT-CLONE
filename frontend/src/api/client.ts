import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('m3_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('m3_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    client.post('/auth/login', { username, password }),
  me: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout'),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => client.get('/dashboard'),
}

// ─── Companies ────────────────────────────────────────────────────────────────

export const companiesApi = {
  list: () => client.get('/companies'),
  get: (id: number) => client.get(`/companies/${id}`),
  create: (data: object) => client.post('/companies', data),
  update: (id: number, data: object) => client.put(`/companies/${id}`, data),
  delete: (id: number) => client.delete(`/companies/${id}`),
  listAnalysts: () => client.get('/companies/analysts/list'),
  symbolMap: () => client.get<Record<string, { id: number; name: string }>>('/companies/symbol-map'),
}

// ─── Financials ───────────────────────────────────────────────────────────────

export const financialsApi = {
  annual: (companyId: number) => client.get(`/companies/${companyId}/annual`),
  quarterly: (companyId: number) => client.get(`/companies/${companyId}/quarterly`),
}

// ─── DCF ──────────────────────────────────────────────────────────────────────

export const dcfApi = {
  get: (companyId: number) => client.get(`/companies/${companyId}/dcf`),
  update: (companyId: number, data: object) => client.put(`/companies/${companyId}/dcf`, data),
  runReverse: (companyId: number) => client.post(`/companies/${companyId}/dcf/reverse`),
  projections: (companyId: number, assumptions: object) =>
    client.post(`/companies/${companyId}/dcf/projections`, assumptions),
}

// ─── Market ───────────────────────────────────────────────────────────────────

export const marketApi = {
  prices: () => client.get('/market/prices'),
  refreshAll: () => client.post('/market/refresh'),
  refreshOne: (companyId: number) => client.post(`/market/refresh/${companyId}`),
  searchTicker: (q: string) => client.get(`/market/search?q=${encodeURIComponent(q)}`),
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export const kpiApi = {
  list: (companyId: number) => client.get(`/companies/${companyId}/kpi`),
  create: (companyId: number, data: { kpi_name: string; kpi_value?: number | null; period?: string }) =>
    client.post(`/companies/${companyId}/kpi`, data),
  update: (companyId: number, kpiId: number, data: { kpi_name: string; kpi_value?: number | null; period?: string }) =>
    client.put(`/companies/${companyId}/kpi/${kpiId}`, data),
  delete: (companyId: number, kpiId: number) => client.delete(`/companies/${companyId}/kpi/${kpiId}`),
  extractImage: (companyId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post(`/companies/${companyId}/kpi/extract-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ─── Files (thesis attachment) ────────────────────────────────────────────────

export const filesApi = {
  uploadThesisFile: (companyId: number, file: File, document_date?: string, notes?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (document_date) form.append('document_date', document_date)
    if (notes) form.append('notes', notes)
    return client.post(`/companies/${companyId}/thesis-file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  downloadThesisFile: (companyId: number) =>
    client.get(`/companies/${companyId}/thesis-file`, { responseType: 'blob' }),
  deleteThesisFile: (companyId: number) => client.delete(`/companies/${companyId}/thesis-file`),
}

// ─── Investee Tracker ────────────────────────────────────────────────────────

export const investeeApi = {
  listPositions: (portfolio?: string) =>
    client.get(`/investee/positions${portfolio ? `?portfolio=${encodeURIComponent(portfolio)}` : ''}`),
  addPosition: (data: object) => client.post('/investee/positions', data),
  deletePosition: (id: number) => client.delete(`/investee/positions/${id}`),
  summary: (portfolio?: string) =>
    client.get(`/investee/summary${portfolio ? `?portfolio=${encodeURIComponent(portfolio)}` : ''}`),
  // Simple holdings
  simpleList: () => client.get('/investee/simple'),
  simpleAdd: (data: { company_id: number; qty: number; avg_buy_price: number }) =>
    client.post('/investee/simple', data),
  simpleUpdate: (id: number, data: { qty: number; avg_buy_price: number }) =>
    client.put(`/investee/simple/${id}`, data),
  simpleDelete: (id: number) => client.delete(`/investee/simple/${id}`),
}

// ─── Research Tasks ───────────────────────────────────────────────────────────

export const tasksApi = {
  list: (params?: { status?: string; assigned_to?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.assigned_to) q.set('assigned_to', params.assigned_to)
    return client.get(`/tasks${q.toString() ? '?' + q.toString() : ''}`)
  },
  create: (data: object) => client.post('/tasks', data),
  update: (id: number, data: object) => client.put(`/tasks/${id}`, data),
  delete: (id: number) => client.delete(`/tasks/${id}`),
  users: () => client.get('/tasks/users/list'),
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  listUsers: () => client.get('/settings/users'),
  listUserNames: () => client.get('/settings/users/names'),
  createUser: (data: { username: string; full_name?: string; role: string; password: string }) =>
    client.post('/settings/users', data),
  updateUser: (userId: number, data: object) => client.put(`/settings/users/${userId}`, data),
  deleteUser: (userId: number) => client.delete(`/settings/users/${userId}`),
  auditLog: (limit = 100) => client.get(`/settings/audit-log?limit=${limit}`),
  // Industries
  listIndustries: () => client.get('/settings/industries'),
  createIndustry: (name: string) => client.post('/settings/industries', { name }),
  deleteIndustry: (id: number) => client.delete(`/settings/industries/${id}`),
  // Brokers
  listBrokers: () => client.get('/settings/brokers'),
  createBroker: (name: string) => client.post('/settings/brokers', { name }),
  deleteBroker: (id: number) => client.delete(`/settings/brokers/${id}`),
  // Benchmark indices
  listBenchmarks: () => client.get('/settings/benchmarks'),
  createBenchmark: (label: string, yahoo_symbol: string) => client.post('/settings/benchmarks', { label, yahoo_symbol }),
  updateBenchmark: (id: number, data: object) => client.put(`/settings/benchmarks/${id}`, data),
  deleteBenchmark: (id: number) => client.delete(`/settings/benchmarks/${id}`),
}

// ─── Screener.in ──────────────────────────────────────────────────────────────

export const screenerApi = {
  preview: (symbol: string, consolidated = true) =>
    client.post('/upload/screener/preview', { symbol, consolidated }),
  confirm: (parseToken: string, symbol: string, nseTicker?: string) =>
    client.post('/upload/screener/confirm', { parse_token: parseToken, symbol, nse_ticker: nseTicker }),
  login: (email: string, password: string) =>
    client.post('/settings/screener-login', { email, password }),
  status: () => client.get('/settings/screener-status'),
}

// ─── Portfolio Tracker ────────────────────────────────────────────────────────

export const portfolioApi = {
  folios: () => client.get('/portfolio/folios'),
  createFolio: (name: string) => client.post('/portfolio/folios', { name }),
  deleteFolio: (id: number) => client.delete(`/portfolio/folios/${id}`),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/portfolio/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  downloadTemplate: () =>
    client.get('/portfolio/upload-template', { responseType: 'blob' }),

  summary: (params?: { folio_id?: number; consolidated?: boolean; include_exited?: boolean }) =>
    client.get('/portfolio/summary', { params }),

  plReport: (params?: { folio_id?: number; from_date?: string; to_date?: string }) =>
    client.get('/portfolio/pl-report', { params }),

  transactions: (params?: { folio_id?: number; symbol?: string; from_date?: string; to_date?: string; trans_type?: string }) =>
    client.get('/portfolio/transactions', { params }),

  addTransaction: (data: object) => client.post('/portfolio/transactions', data),
  updateTransaction: (id: number, data: object) => client.put(`/portfolio/transactions/${id}`, data),
  deleteTransaction: (id: number) => client.delete(`/portfolio/transactions/${id}`),

  updateAsset: (assetId: number, data: { sector?: string; name?: string; symbol?: string }) =>
    client.put(`/portfolio/assets/${assetId}`, data),

  exportTransactions: (params: { folio_id?: number; symbol?: string; from_date?: string; to_date?: string; trans_type?: string }) =>
    client.get('/portfolio/transactions/export', { params, responseType: 'blob' }),

  benchmarks: () => client.get('/portfolio/benchmarks'),
  addBenchmark: (label: string, yahoo_symbol: string) => client.post('/portfolio/benchmarks', { label, yahoo_symbol }),
  deleteBenchmark: (id: number) => client.delete(`/portfolio/benchmarks/${id}`),

  syncDividends: () => client.post('/portfolio/dividends/sync'),
  dividends: (params?: { folio_id?: number; symbol?: string; from_date?: string; to_date?: string }) =>
    client.get('/portfolio/dividends', { params }),
  dividendTotals: (folio_id?: number) =>
    client.get('/portfolio/dividends/totals', { params: folio_id ? { folio_id } : {} }),

  symbolMappings: () => client.get('/portfolio/symbol-mappings'),
  addMapping: (data: { raw_name: string; symbol: string }) => client.post('/portfolio/symbol-mappings', data),
  deleteMapping: (id: number) => client.delete(`/portfolio/symbol-mappings/${id}`),

  reconcile: (file: File, folioId?: number) => {
    const form = new FormData()
    form.append('file', file)
    const url = folioId ? `/portfolio/reconcile?folio_id=${folioId}` : '/portfolio/reconcile'
    return client.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  refreshQuotes: () => client.post('/portfolio/refresh-quotes'),

  returns: (params?: { folio_id?: number; benchmarks?: string }) =>
    client.get('/portfolio/returns', { params }),

  analytics: (params?: { folio_id?: number }) =>
    client.get('/portfolio/analytics', { params }),
}

// ─── Document Repository ──────────────────────────────────────────────────────

export const documentsApi = {
  list: () => client.get('/documents'),
  upload: (data: { company_name: string; document_date?: string; notes?: string; file: File }) => {
    const form = new FormData()
    form.append('company_name', data.company_name)
    if (data.document_date) form.append('document_date', data.document_date)
    if (data.notes) form.append('notes', data.notes)
    form.append('file', data.file)
    return client.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  download: (id: number) => client.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id: number) => client.delete(`/documents/${id}`),
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  get: () => client.get('/notifications'),
}

// ─── Announcements ────────────────────────────────────────────────────────────

export const announcementsApi = {
  list: () => client.get('/announcements'),
  create: (data: object) => client.post('/announcements', data),
  update: (id: number, data: object) => client.put(`/announcements/${id}`, data),
  delete: (id: number) => client.delete(`/announcements/${id}`),
}

// ─── Feedback / Bug Tracker ───────────────────────────────────────────────────

export const feedbackApi = {
  list: () => client.get('/feedback'),
  create: (data: { type: string; title: string; description?: string }) => client.post('/feedback', data),
  updateStatus: (id: number, status: string) => client.put(`/feedback/${id}`, { status }),
  delete: (id: number) => client.delete(`/feedback/${id}`),
}

// ─── Execution ────────────────────────────────────────────────────────────────

export const executionApi = {
  listDecisions: () => client.get('/execution/decisions'),
  createDecision: (data: object) => client.post('/execution/decisions', data),
  updateDecision: (id: number, data: object) => client.put(`/execution/decisions/${id}`, data),
  deleteDecision: (id: number) => client.delete(`/execution/decisions/${id}`),
  listTrades: (decisionId?: number) =>
    client.get('/execution/trades', { params: decisionId ? { decision_id: decisionId } : {} }),
  createTrade: (data: object) => client.post('/execution/trades', data),
  updateTrade: (id: number, data: object) => client.put(`/execution/trades/${id}`, data),
  deleteTrade: (id: number) => client.delete(`/execution/trades/${id}`),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  listChannels: () => client.get('/chat/channels'),
  createChannel: (name: string, description?: string) => client.post('/chat/channels', { name, description }),
  deleteChannel: (id: number) => client.delete(`/chat/channels/${id}`),
  getMessages: (channelId: number, limit = 100, beforeId?: number) =>
    client.get(`/chat/channels/${channelId}/messages`, { params: { limit, ...(beforeId ? { before_id: beforeId } : {}) } }),
  postMessage: (channelId: number, content: string) =>
    client.post(`/chat/channels/${channelId}/messages`, { content }),
  getDM: (username: string) => client.get(`/chat/dm/${username}`),
  onlineUsers: () => client.get('/chat/online'),
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export const uploadApi = {
  preview: (file: File, quarter?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (quarter) form.append('quarter', quarter)
    return client.post('/upload/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  confirm: (parseToken: string, quarter?: string) => {
    const form = new FormData()
    form.append('parse_token', parseToken)
    if (quarter) form.append('quarter', quarter)
    return client.post('/upload/confirm', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  history: () => client.get('/upload/history'),
  companyHistory: (companyId: number) => client.get(`/upload/history/${companyId}`),
  downloadTemplate: (modelType: 'bank' | 'nbfc') =>
    client.get(`/upload/template/${modelType}`, { responseType: 'blob' }),
  downloadUpload: (uploadId: number) =>
    client.get(`/upload/download/${uploadId}`, { responseType: 'blob' }),
  deleteUpload: (uploadId: number) =>
    client.delete(`/upload/history/${uploadId}`),
}
