import React, { useState, useEffect } from 'react';
import { History, Shield, Filter, Search, Calendar, User } from 'lucide-react';
import { api } from '../services/api.ts';
import { AuditLog } from '../types/index.ts';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const loadAudit = async () => {
    try {
      setLoading(true);
      const data = await api.audit.getAll();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const actionStyles: Record<string, string> = {
    SALE: 'bg-rose-100 text-rose-800',
    PURCHASE: 'bg-emerald-100 text-emerald-800',
    STOCK_ADJUSTMENT: 'bg-purple-100 text-purple-800',
    CREATE: 'bg-blue-100 text-blue-800',
    UPDATE: 'bg-amber-100 text-amber-800',
    DELETE: 'bg-red-100 text-red-800',
    VALIDATE: 'bg-emerald-100 text-emerald-800',
    CANCEL: 'bg-red-100 text-red-800',
    LOGIN: 'bg-slate-100 text-slate-800',
    EXPENSE: 'bg-amber-100 text-amber-800',
  };

  const filteredLogs = logs.filter(l => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchesSearch =
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Piste d'Audit & Journal Inaltérable
          </h1>
          <p className="text-xs text-slate-500">
            Historique certifié et immuable de toutes les opérations métier critiques
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher dans les descriptions, modules ou auteurs..."
        statuses={[
          { value: 'SALE', label: 'Ventes' },
          { value: 'PURCHASE', label: 'Achats' },
          { value: 'STOCK_ADJUSTMENT', label: 'Ajustements de stock' },
          { value: 'EXPENSE', label: 'Dépenses' },
          { value: 'VALIDATE', label: 'Validations' },
          { value: 'CREATE', label: 'Créations' },
          { value: 'LOGIN', label: 'Connexions' },
        ]}
        selectedStatus={actionFilter}
        onStatusChange={setActionFilter}
      />

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Date & Heure</th>
                <th className="py-3.5 px-4">Utilisateur</th>
                <th className="py-3.5 px-4">Rôle</th>
                <th className="py-3.5 px-4 text-center">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Description de l'Opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chargement des journaux daudit...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucun événement daudit trouvé.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => {
                  const date = new Date(l.createdAt);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {date.toLocaleDateString('fr-FR')}{' '}
                        <span className="text-[10px] text-slate-400">
                          {date.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {l.userEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {l.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            actionStyles[l.action] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                        {l.module}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{l.description}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
