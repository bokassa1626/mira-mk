import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  RefreshCw,
  Coins,
  UserCheck,
  Shield,
  LogOut,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Role } from '../../types/index.ts';

export const Navbar: React.FC = () => {
  const { user, role, currency, toggleCurrency, loginWithRole, logout, exchangeRate } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  const fetchAlerts = async () => {
    try {
      const data = await api.alerts.getAll();
      setAlertCount(data.totalAlerts);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const rolesList: { role: Role; label: string; name: string }[] = [
    { role: 'ADMINISTRATEUR', label: 'Admin (Bokassa N.)', name: 'Bokassa Ntwali' },
    { role: 'GESTIONNAIRE', label: 'Gestionnaire (Moïse K.)', name: 'Moïse Kalala' },
    { role: 'VENDEUR', label: 'Vendeuse (Rachel M.)', name: 'Rachel Mwamba' },
    { role: 'CONTROLEUR', label: 'Contrôleur (Patrick I.)', name: 'Patrick Ilunga' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0 select-none">
      {/* Location & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
          <MapPin className="w-3.5 h-3.5 text-rose-600" />
          <span>Lubumbashi / Mitipisha</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Currency Switcher */}
        <button
          onClick={toggleCurrency}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold transition-all hover:bg-slate-100"
          title={`Basculer entre CDF et USD (1 USD = ${exchangeRate} CDF)`}
        >
          <Coins className="w-4 h-4 text-amber-600" />
          <span>Devise :</span>
          <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">
            {currency}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            ({currency === 'CDF' ? `~${exchangeRate} CDF/$` : `1$ = ${exchangeRate} CDF`})
          </span>
        </button>

        {/* Quick RBAC Role Selector for seamless testing */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <span className="text-xs font-medium text-slate-600 hidden md:inline">Rôle :</span>
          <select
            value={role || 'ADMINISTRATEUR'}
            onChange={e => loginWithRole(e.target.value as Role)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
          >
            {rolesList.map(r => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Consulter les alertes stocks"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {alertCount}
            </span>
          )}
        </button>

        {/* Refresh Data */}
        <button
          onClick={() => {
            fetchAlerts();
            window.location.reload();
          }}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Rafraîchir les données"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* User Info / Logout */}
        <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
