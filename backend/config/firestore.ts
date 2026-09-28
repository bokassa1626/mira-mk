import { adminFirestore } from './firebaseAdmin.ts';
import { store } from '../../server/db.ts';

export const db = adminFirestore;

// Helper to get collections
export const collections = {
  users: 'users',
  products: 'products',
  categories: 'categories',
  suppliers: 'suppliers',
  purchases: 'purchases',
  sales: 'sales',
  expenses: 'expenses',
  stockMovements: 'stock_movements',
  inventorySessions: 'inventory_sessions',
  losses: 'losses',
  payments: 'payments',
  alerts: 'alerts',
  dailyReports: 'daily_reports',
  auditLogs: 'audit_logs',
  settings: 'settings',
};

export { store };
