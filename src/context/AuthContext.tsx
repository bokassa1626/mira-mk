import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  currency: 'CDF' | 'USD';
  exchangeRate: number; // default 2850
  loginWithRole: (targetRole: Role) => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  loginWithFirebaseToken: (idToken: string) => Promise<void>;
  logout: () => void;
  toggleCurrency: () => void;
  formatMoney: (amountCdf: number) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'CDF' | 'USD'>('CDF');
  const [exchangeRate, setExchangeRate] = useState(2850);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const saved = localStorage.getItem('miramk_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        } else {
          // Default to Administrator on first visit
          const logged = await api.auth.login({ role: 'ADMINISTRATEUR' });
          setUser(logged);
          localStorage.setItem('miramk_user', JSON.stringify(logged));
        }

        // Fetch settings for exchange rate
        const settings = await api.settings.get();
        if (settings?.exchangeRate) {
          setExchangeRate(settings.exchangeRate);
        }
      } catch (err) {
        console.error('Erreur initAuth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginWithRole = async (targetRole: Role) => {
    setLoading(true);
    try {
      const logged = await api.auth.login({ role: targetRole });
      setUser(logged);
      localStorage.setItem('miramk_user', JSON.stringify(logged));
    } catch (e) {
      console.error(e);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    setLoading(true);
    try {
      const logged = await api.auth.login({ email });
      setUser(logged);
      localStorage.setItem('miramk_user', JSON.stringify(logged));
    } catch (e) {
      console.error(e);
      alert('Utilisateur non trouvé avec cet email.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithFirebaseToken = async (idToken: string) => {
    setLoading(true);
    try {
      localStorage.setItem('miramk_id_token', idToken);
      const logged = await api.auth.login({ idToken });
      setUser(logged);
      localStorage.setItem('miramk_user', JSON.stringify(logged));
      // Also establish session cookie if available
      try {
        await api.auth.createSession(idToken);
      } catch {
        // non-blocking
      }
    } catch (e) {
      console.error('Erreur Firebase Auth Backend:', e);
      localStorage.removeItem('miramk_id_token');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('miramk_user');
    localStorage.removeItem('miramk_id_token');
    setUser(null);
  };

  const toggleCurrency = () => {
    setCurrency(prev => (prev === 'CDF' ? 'USD' : 'CDF'));
  };

  const formatMoney = (amountCdf: number) => {
    if (currency === 'USD') {
      const valUsd = amountCdf / exchangeRate;
      return `$${valUsd.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    return `${Math.round(amountCdf).toLocaleString('fr-FR')} CDF`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        currency,
        exchangeRate,
        loginWithRole,
        loginWithEmail,
        loginWithFirebaseToken,
        logout,
        toggleCurrency,
        formatMoney,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
