import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  Package,
  Plus,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Loss } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';

export const Alerts: React.FC = () => {
  const { formatMoney } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{
    lowStock: Product[];
    outOfStock: Product[];
    pendingLosses: Loss[];
    totalAlerts: number;
  }>({
    lowStock: [],
    outOfStock: [],
    pendingLosses: [],
    totalAlerts: 0,
  });

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.alerts.getAll();
      setAlerts(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Centre d'Alertes & Surveillance</h1>
          <p className="text-xs text-slate-500">
            Détection automatique des ruptures, stocks sous le seuil d'alerte et avaries en attente
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Vérification des stocks en cours...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Out of Stock (Ruptures) */}
          <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Ruptures Totales Constatées ({alerts.outOfStock.length})
                  </h2>
                  <p className="text-xs text-slate-500">Stock égal à 0 — Vente bloquée</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/purchases')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Commander aux fournisseurs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {alerts.outOfStock.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 bg-slate-50 rounded-xl px-4">
                Aucune viande en rupture totale. Félicitations !
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {alerts.outOfStock.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-red-200 bg-red-50/30 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-red-600 font-bold">{p.code}</span>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{p.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        Seuil minimum : {p.minimumStock} {p.unit}
                      </p>
                    </div>
                    <Badge variant="danger" size="sm">
                      0 {p.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Low Stock (Stocks Faibles) */}
          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Stocks Critiques / Seuil Minimum Atteint ({alerts.lowStock.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Stock actuel inférieur ou égal au seuil de sécurité
                  </p>
                </div>
              </div>
            </div>

            {alerts.lowStock.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 bg-slate-50 rounded-xl px-4">
                Tous les stocks sont au-dessus de leur seuil d'alerte respectif.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {alerts.lowStock.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-amber-700 font-bold">{p.code}</span>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{p.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        Alerte déclenchée à {p.minimumStock} {p.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-amber-800">
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Pending Losses */}
          {alerts.pendingLosses.length > 0 && (
            <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">
                      Pertes en Attente de Validation ({alerts.pendingLosses.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Nécessite la validation d'un Gestionnaire ou Administrateur
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/losses')}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Gérer les pertes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {alerts.pendingLosses.map(l => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-purple-50/30 border border-purple-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{l.productName}</span>
                      <p className="text-[11px] text-slate-500">
                        -{l.quantity} ({l.type}) • {l.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-600">
                        {formatMoney(l.totalValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
