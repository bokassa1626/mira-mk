import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Beef,
  PlusCircle,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { Sale, StockMovement } from '../types/index.ts';

export const Dashboard: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
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
  } | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { metrics, charts, recentSales, recentMovements } = data;

  const COLORS = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-rose-600/40 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
              Gestion & Contrôle
            </span>
            <span className="text-xs text-slate-300">Boucherie Mira-Mk • Lubumbashi</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 text-white">
            Tableau de Bord Quotidien
          </h1>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Supervision des flux de viandes, mouvements de stock, ventes au comptoir, marges réelles
            et contrôle de rentabilité.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {(role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE' || role === 'VENDEUR') && (
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Nouvelle Vente (POS)</span>
            </button>
          )}
          {(role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE') && (
            <button
              onClick={() => navigate('/purchases')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Réception Achat</span>
            </button>
          )}
          <button
            onClick={() => navigate('/stock')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span>État des Stocks</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventes du Jour"
          value={formatMoney(metrics.todayRevenue)}
          subtitle={`${metrics.totalSalesCount} ticket(s) clôturé(s)`}
          icon={ShoppingCart}
          variant="primary"
          trend="+ Recettes"
        />

        <StatCard
          title="Bénéfice Net Estimé"
          value={formatMoney(metrics.todayNetProfit)}
          subtitle={`Marge brute: ${formatMoney(metrics.todayGrossMargin)}`}
          icon={TrendingUp}
          variant="success"
          trend="Marge - Charges"
        />

        <StatCard
          title="Valeur Totale du Stock"
          value={formatMoney(metrics.totalStockValue)}
          subtitle={`${metrics.totalProducts} produits en catalogue`}
          icon={Beef}
          variant="info"
        />

        <StatCard
          title="Alertes de Stock"
          value={metrics.lowStockCount + metrics.outOfStockCount}
          subtitle={`${metrics.outOfStockCount} rupture(s), ${metrics.lowStockCount} faible(s)`}
          icon={AlertTriangle}
          variant={metrics.outOfStockCount > 0 ? 'danger' : 'warning'}
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Achats Marchandises (Jour)
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatMoney(metrics.todayPurchases)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Dépenses & Charges (Jour)
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatMoney(metrics.todayExpenses)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Marge Brute Réalisée
            </span>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">
              {formatMoney(metrics.todayGrossMargin)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit 7 Days */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Évolution des Ventes & Bénéfices (7 jours)
              </h2>
              <p className="text-xs text-slate-500">Chiffre d'affaires vs Bénéfice net estimé</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-md">
              Données réelles
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.last7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={val => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatMoney(Number(val)), '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Ventes"
                  stroke="#e11d48"
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Bénéfice estimé"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Meat Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Répartition par Famille</h2>
            <p className="text-xs text-slate-500">Part du chiffre d'affaires par type de viande</p>
          </div>

          <div className="flex-1 h-52 w-full flex items-center justify-center">
            {charts.categorySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categorySalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.categorySalesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatMoney(Number(val)), 'Part']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Aucune vente enregistrée pour le moment</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Sales & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Dernières Ventes Comptoir</h2>
              <p className="text-xs text-slate-500">Factures générées récemment</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune vente récente</p>
            ) : (
              recentSales.map(sale => (
                <div
                  key={sale.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-mono font-bold text-xs">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {sale.saleNumber}
                        </span>
                        <Badge
                          variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {sale.status === 'COMPLETED' ? 'Validée' : 'Annulée'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sale.customerName} • {sale.items.length} article(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold font-mono text-xs text-slate-900">
                      {formatMoney(sale.total)}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      +{formatMoney(sale.grossMargin)} marge
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Derniers Mouvements de Stock</h2>
              <p className="text-xs text-slate-500">Traçabilité entrée, sortie, ajustement</p>
            </div>
            <button
              onClick={() => navigate('/stock')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Voir le journal
            </button>
          </div>

          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucun mouvement récent</p>
            ) : (
              recentMovements.map(mvt => {
                const isPositive = mvt.quantity > 0;
                return (
                  <div
                    key={mvt.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {mvt.productName}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            mvt.type === 'PURCHASE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mvt.type === 'SALE'
                              ? 'bg-rose-100 text-rose-800'
                              : mvt.type === 'LOSS'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mvt.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        {mvt.reason}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${mvt.quantity}` : mvt.quantity}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Stock: {mvt.newStock}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
