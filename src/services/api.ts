import {
  User, Product, Category, Supplier, Purchase, Sale,
  Expense, Loss, InventorySession, StockMovement, AuditLog,
  CompanySettings, Role
} from '../types/index.ts';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  // Read active user ID and token from localStorage if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const savedUser = localStorage.getItem('miramk_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u?.uid) headers['x-user-id'] = u.uid;
      if (u?.role) headers['x-user-role'] = u.role;
    }
    const token = localStorage.getItem('miramk_id_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || 'Erreur lors de la requête serveur.');
  }

  return data.data;
}

export const api = {
  // Auth
  auth: {
    login: (payload: { role?: Role; email?: string; uid?: string; idToken?: string }) =>
      fetchJson<User>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => fetchJson<User>('/auth/me'),
    verifyToken: (idToken: string) =>
      fetchJson<{ valid: boolean; claims: any; user: User | null }>('/auth/verify-token', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    createSession: (idToken: string) =>
      fetchJson<{ sessionCookie: string }>('/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    syncUser: (user: { uid: string; email?: string; displayName?: string; photoURL?: string }) =>
      fetchJson<User>('/auth/sync-user', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    logout: () => fetchJson<void>('/auth/logout', { method: 'POST' }),
  },

  // Products & Categories
  products: {
    getAll: (params?: { category?: string; search?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      if (params?.status) q.append('status', params.status);
      return fetchJson<Product[]>(`/products?${q.toString()}`);
    },
    getById: (id: string) => fetchJson<Product>(`/products/${id}`),
    create: (data: Partial<Product>) =>
      fetchJson<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) =>
      fetchJson<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/products/${id}`, { method: 'DELETE' }),
    getCategories: () => fetchJson<Category[]>('/categories'),
  },

  // Stock
  stock: {
    getOverview: () =>
      fetchJson<{
        products: Product[];
        summary: {
          totalProducts: number;
          totalValuation: number;
          totalWeightKg: number;
          lowStockCount: number;
          outOfStockCount: number;
        };
      }>('/stock'),
    getMovements: (params?: { productId?: string; type?: string }) => {
      const q = new URLSearchParams();
      if (params?.productId) q.append('productId', params.productId);
      if (params?.type) q.append('type', params.type);
      return fetchJson<StockMovement[]>(`/stock/movements?${q.toString()}`);
    },
    adjust: (productId: string, newStock: number, reason: string) =>
      fetchJson<Product>('/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({ productId, newStock, reason }),
      }),
  },

  // Purchases & Suppliers
  purchases: {
    getAll: () => fetchJson<Purchase[]>('/purchases'),
    getById: (id: string) => fetchJson<Purchase>(`/purchases/${id}`),
    create: (data: any) =>
      fetchJson<Purchase>('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    getSuppliers: () => fetchJson<Supplier[]>('/suppliers'),
    createSupplier: (data: Partial<Supplier>) =>
      fetchJson<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Sales & Invoices
  sales: {
    getAll: () => fetchJson<Sale[]>('/sales'),
    getById: (id: string) => fetchJson<Sale>(`/sales/${id}`),
    create: (data: any) =>
      fetchJson<Sale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: string) =>
      fetchJson<Sale>(`/sales/${id}/cancel`, { method: 'POST' }),
  },

  // Expenses
  expenses: {
    getAll: () => fetchJson<Expense[]>('/expenses'),
    create: (data: Partial<Expense>) =>
      fetchJson<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Losses
  losses: {
    getAll: () => fetchJson<Loss[]>('/losses'),
    create: (data: Partial<Loss>) =>
      fetchJson<Loss>('/losses', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string) =>
      fetchJson<Loss>(`/losses/${id}/approve`, { method: 'PUT' }),
  },

  // Inventory
  inventory: {
    getAll: () => fetchJson<InventorySession[]>('/inventory'),
    create: (items: any[]) =>
      fetchJson<InventorySession>('/inventory', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // Reports
  reports: {
    getDashboard: () =>
      fetchJson<{
        metrics: {
          todayRevenue: number;
          todayPurchases: number;
          todayExpenses: number;
          todayGrossMargin: number;
          todayNetProfit: number;
          totalStockValue: number;
          lowStockCount: number;
          outOfStockCount: number;
          totalProducts: number;
          totalSalesCount: number;
        };
        charts: {
          last7Days: { date: string; sales: number; profit: number; expenses: number }[];
          categorySalesData: { name: string; value: number }[];
        };
        recentSales: Sale[];
        recentMovements: StockMovement[];
      }>('/reports/dashboard'),
    getDaily: (date?: string) => {
      const q = date ? `?date=${date}` : '';
      return fetchJson<{
        date: string;
        summary: {
          totalSales: number;
          totalCost: number;
          grossMargin: number;
          totalPurchases: number;
          totalExpenses: number;
          totalLosses: number;
          netProfit: number;
        };
        sales: Sale[];
        purchases: Purchase[];
        expenses: Expense[];
        losses: Loss[];
        movements: StockMovement[];
      }>(`/reports/daily${q}`);
    },
  },

  // Alerts
  alerts: {
    getAll: () =>
      fetchJson<{
        lowStock: Product[];
        outOfStock: Product[];
        pendingLosses: Loss[];
        totalAlerts: number;
      }>('/alerts'),
  },

  // Audit
  audit: {
    getAll: () => fetchJson<AuditLog[]>('/audit'),
  },

  // Users
  users: {
    getAll: () => fetchJson<User[]>('/users'),
    create: (data: Partial<User>) =>
      fetchJson<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id: string, role: Role, status?: 'ACTIVE' | 'INACTIVE') =>
      fetchJson<User>(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role, status }),
      }),
  },

  // Settings
  settings: {
    get: () => fetchJson<CompanySettings>('/settings'),
    update: (data: Partial<CompanySettings>) =>
      fetchJson<CompanySettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
