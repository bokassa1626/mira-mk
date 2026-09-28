import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { testConnection } from './services/firebase.ts';

// Pages
import { Dashboard } from './pages/Dashboard.tsx';
import { Sales } from './pages/Sales.tsx';
import { Invoices } from './pages/Invoices.tsx';
import { Products } from './pages/Products.tsx';
import { Categories } from './pages/Categories.tsx';
import { Stock } from './pages/Stock.tsx';
import { Purchases } from './pages/Purchases.tsx';
import { Suppliers } from './pages/Suppliers.tsx';
import { Expenses } from './pages/Expenses.tsx';
import { Inventory } from './pages/Inventory.tsx';
import { Losses } from './pages/Losses.tsx';
import { Alerts } from './pages/Alerts.tsx';
import { Reports } from './pages/Reports.tsx';
import { AuditLogs } from './pages/AuditLogs.tsx';
import { Users } from './pages/Users.tsx';
import { Settings } from './pages/Settings.tsx';
import { Login } from './pages/Login.tsx';

// Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  useEffect(() => {
    // Validate connection to Firestore on initial boot as required by Firebase skill
    testConnection().then(connected => {
      if (connected) {
        console.log('Connecté avec succès à Cloud Firestore pour Boucherie Mira-Mk');
      }
    });
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/losses" element={<Losses />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
