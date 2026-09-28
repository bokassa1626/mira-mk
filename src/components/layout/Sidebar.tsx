import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Beef,
  Layers,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Settings,
  ClipboardCheck,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Role } from '../../types/index.ts';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Role[];
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { role, user } = useAuth();

  const menuItems: MenuItem[] = [
    {
      name: 'Tableau de bord',
      path: '/',
      icon: LayoutDashboard,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'VENDEUR', 'CONTROLEUR'],
    },
    {
      name: 'Caisse & Ventes (POS)',
      path: '/sales',
      icon: ShoppingCart,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'VENDEUR'],
      badge: 'Caisse',
    },
    {
      name: 'Factures émises',
      path: '/invoices',
      icon: Receipt,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'VENDEUR', 'CONTROLEUR'],
    },
    {
      name: 'Viandes & Produits',
      path: '/products',
      icon: Beef,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR'],
    },
    {
      name: 'Familles & Catégories',
      path: '/categories',
      icon: Layers,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR'],
    },
    {
      name: 'Gestion des Stocks',
      path: '/stock',
      icon: Package,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'VENDEUR', 'CONTROLEUR'],
    },
    {
      name: 'Achats & Réceptions',
      path: '/purchases',
      icon: FileSpreadsheet,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR'],
    },
    {
      name: 'Fournisseurs',
      path: '/suppliers',
      icon: Building2,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE'],
    },
    {
      name: 'Dépenses & Charges',
      path: '/expenses',
      icon: DollarSign,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR'],
    },
    {
      name: 'Inventaires Physiques',
      path: '/inventory',
      icon: ClipboardCheck,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR'],
    },
    {
      name: 'Pertes & Avaries',
      path: '/losses',
      icon: TrendingDown,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR', 'VENDEUR'],
    },
    {
      name: 'Alertes Stocks',
      path: '/alerts',
      icon: AlertTriangle,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR', 'VENDEUR'],
    },
    {
      name: 'Rapports & Clôture',
      path: '/reports',
      icon: FileSpreadsheet,
      allowedRoles: ['ADMINISTRATEUR', 'GESTIONNAIRE', 'CONTROLEUR'],
    },
    {
      name: 'Audit & Contrôle',
      path: '/audit',
      icon: History,
      allowedRoles: ['ADMINISTRATEUR', 'CONTROLEUR'],
    },
    {
      name: 'Utilisateurs & Accès',
      path: '/users',
      icon: Users,
      allowedRoles: ['ADMINISTRATEUR'],
    },
    {
      name: 'Paramètres Entreprise',
      path: '/settings',
      icon: Settings,
      allowedRoles: ['ADMINISTRATEUR'],
    },
  ];

  const filteredMenu = menuItems.filter(item => (role ? item.allowedRoles.includes(role) : false));

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-700 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40 font-bold text-xl">
            M
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white leading-tight">
              Boucherie Mira-Mk
            </h1>
            <p className="text-xs text-rose-400 font-medium">Lubumbashi, RDC</p>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-1 rounded truncate">
          📍 Mitipisha, Av. Kinshasa
        </div>
      </div>

      {/* Current User Badge */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Opérateur Actif
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white truncate">
            {user ? `${user.firstName} ${user.lastName}` : 'Invité'}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              role === 'ADMINISTRATEUR'
                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                : role === 'GESTIONNAIRE'
                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                : role === 'VENDEUR'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
            }`}
          >
            {role || 'NON CONNECTÉ'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredMenu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-rose-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/40">
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          Système Sécurisé
        </span>
        <span className="text-slate-500 font-mono">v1.0-RDC</span>
      </div>
    </aside>
  );
};
