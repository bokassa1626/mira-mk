import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Beef,
  PlusCircle,
  Receipt,
  Clock,
  ChevronRight,
  RefreshCw,
  Scale,
  Truck,
  ShieldCheck,
  CheckCircle2
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
import { Sale, StockMovement, Product, Loss } from '../types/index.ts';

export const Dashboard: React.FC = () => {
  const { formatMoney, exchangeRate, currency, role, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadDashboardData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [dashRes, alertsRes] = await Promise.all([
        api.reports.getDashboard(),
        api.alerts.getAll(),
      ]);

      setData(dashRes);
      setAlerts(alertsRes);
    } catch (e) {
      console.error('Erreur lors du chargement du tableau de bord:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Chargement des données en temps réel...</p>
      </div>
    );
  }

  const { metrics, charts, recentSales, recentMovements } = data;
  const criticalStockCount = metrics.outOfStockCount + metrics.lowStockCount;

  // Secondary currency helper
  const formatSecondaryCurrency = (amountCDF: number) => {
    if (!exchangeRate || exchangeRate <= 0) return null;
    const usd = amountCDF / exchangeRate;
    return `≈ $${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  const COLORS = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 rounded-2xl text-white shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-rose-600/40 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
              Supervision Boucherie
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Boucherie Mira-Mk • Mitipisha, Lubumbashi
            </span>
            <span className="text-[11px] text-slate-400 capitalize">
              • {todayFormatted}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight mt-1.5 text-white flex items-center gap-2">
            Tableau de Bord & Activité du Jour
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Indicateurs de ventes de viandes, surveillance des niveaux de stock critique en chambre froide,
            gestion de trésorerie et conformité réglementaire.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Actualiser les indicateurs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
            <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>

          {(role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE' || role === 'VENDEUR') && (
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Caisse & Vente (POS)</span>
            </button>
          )}

          {(role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE') && (
            <button
              onClick={() => navigate('/purchases')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Arrivage Fournisseur</span>
            </button>
          )}

          <button
            onClick={() => navigate('/stock')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span>Chambre Froide</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventes du Jour */}
        <StatCard
          title="Ventes du Jour"
          value={formatMoney(metrics.todayRevenue)}
          subtitle={
            formatSecondaryCurrency(metrics.todayRevenue)
              ? `${formatSecondaryCurrency(metrics.todayRevenue)} • ${metrics.totalSalesCount} ticket(s)`
              : `${metrics.totalSalesCount} ticket(s) encaissé(s)`
          }
          icon={ShoppingCart}
          variant="primary"
          trend="+ Recettes directes"
        />

        {/* KPI 2: Stock Critique & Ruptures */}
        <div
          onClick={() => navigate('/alerts')}
          className={`p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
            metrics.outOfStockCount > 0
              ? 'bg-red-50/50 border-red-200 hover:border-red-300'
              : metrics.lowStockCount > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Stock Critique & Alertes
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>{criticalStockCount}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                  {metrics.outOfStockCount} rupture(s)
                </span>
              </h3>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                metrics.outOfStockCount > 0
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : 'bg-amber-100 text-amber-600 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {metrics.lowStockCount} produit(s) sous le seuil d'alerte
            </span>
            <span className="font-semibold text-rose-600 flex items-center gap-0.5">
              Voir alertes <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 3: Valeur Totale du Stock en Chambre Froide */}
        <StatCard
          title="Stock en Chambre Froide"
          value={formatMoney(metrics.totalStockValue)}
          subtitle={
            formatSecondaryCurrency(metrics.totalStockValue)
              ? `${formatSecondaryCurrency(metrics.totalStockValue)} (${metrics.totalProducts} réf.)`
              : `${metrics.totalProducts} références actives au catalogue`
          }
          icon={Beef}
          variant="info"
          trend="Valorisation au coût d'achat"
        />

        {/* KPI 4: Marge & Bénéfice Net */}
        <StatCard
          title="Bénéfice Net Estimé"
          value={formatMoney(metrics.todayNetProfit)}
          subtitle={`Marge brute: ${formatMoney(metrics.todayGrossMargin)}`}
          icon={TrendingUp}
          variant={metrics.todayNetProfit >= 0 ? 'success' : 'warning'}
          trend="Marge - Charges - Pertes"
        />
      </div>

      {/* 3. Secondary Informative Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Achats & Réceptions de Viande */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Arrivages / Achats (Jour)</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {formatMoney(metrics.todayPurchases)}
            </p>
            {formatSecondaryCurrency(metrics.todayPurchases) && (
              <p className="text-[11px] text-slate-500">
                {formatSecondaryCurrency(metrics.todayPurchases)}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Dépenses & Charges */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-rose-600" />
              <span>Dépenses & Charges (Jour)</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {formatMoney(metrics.todayExpenses)}
            </p>
            {formatSecondaryCurrency(metrics.todayExpenses) && (
              <p className="text-[11px] text-slate-500">
                {formatSecondaryCurrency(metrics.todayExpenses)}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Marge Commerciale Réalisée */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Marge Commerciale Brute</span>
            </div>
            <p className="text-xl font-bold text-purple-700">
              {formatMoney(metrics.todayGrossMargin)}
            </p>
            <p className="text-[11px] text-purple-600 font-medium">
              Taux estimé:{' '}
              {metrics.todayRevenue > 0
                ? `${Math.round((metrics.todayGrossMargin / metrics.todayRevenue) * 100)}% du CA`
                : '0%'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. DEDICATED INFORMATIVE CARDS: NIVEAU DE STOCK CRITIQUE & ALERTES RÉCENTES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>Surveillance des Stocks Critiques & Alertes Récentes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Détection automatique des ruptures de viandes, des approvisionnements requis et des avaries déclarées
            </p>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200/60 w-fit"
          >
            <span>Centre d'Alertes Complet</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Interactive Alert Sub-cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Ruptures Totales (0 kg) */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                Ruptures Totales (0 {currency})
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-200 text-red-900">
                {alerts.outOfStock.length}
              </span>
            </div>

            {alerts.outOfStock.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <p>Aucune rupture totale en chambre froide</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.outOfStock.slice(0, 3).map(prod => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-lg bg-white border border-red-200 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Code: {prod.code} • Seuil: {prod.minimumStock} {prod.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/purchases')}
                      className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-[10px] cursor-pointer"
                    >
                      Commander
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card B: Stock Sous Seuil Minimal */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Sous le Seuil Minimal
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {alerts.lowStock.length}
              </span>
            </div>

            {alerts.lowStock.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <p>Tous les stocks respectent les seuils minimaux</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.lowStock.slice(0, 3).map(prod => {
                  const percentage = Math.min(100, Math.round((prod.currentStock / prod.minimumStock) * 100));
                  return (
                    <div
                      key={prod.id}
                      className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-slate-900">{prod.name}</p>
                        <span className="font-mono text-xs font-bold text-amber-700">
                          {prod.currentStock} / {prod.minimumStock} {prod.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card C: Pertes & Avaries Récentes */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Pertes & Avaries Récentes
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {alerts.pendingLosses.length}
              </span>
            </div>

            {alerts.pendingLosses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
                <p>Aucune perte en attente d'approbation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.pendingLosses.slice(0, 3).map(loss => (
                  <div
                    key={loss.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{loss.productName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                        {loss.quantity} {loss.unit} • {loss.reason}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-600">
                      -{formatMoney(loss.totalValue || loss.totalLossValue || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit 7 Days */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tendance des Ventes & Bénéfices (7 derniers jours)
              </h2>
              <p className="text-xs text-slate-500">Recettes brutes vs Bénéfice net estimé en Francs Congolais</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">
              Données directes caisse
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
                  name="Ventes (CA)"
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
            <p className="text-xs text-slate-500">Part du chiffre d'affaires par type de découpe</p>
          </div>

          <div className="flex-1 h-52 w-full flex items-center justify-center">
            {charts.categorySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categorySalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
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

      {/* 6. Operational Activity Streams: Recent Sales & Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Counter Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Dernières Ventes au Comptoir</h2>
              <p className="text-xs text-slate-500">Factures générées en caisse avec détail de marge</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tout</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Aucune vente enregistrée récemment</p>
            ) : (
              recentSales.map(sale => (
                <div
                  key={sale.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-mono font-bold text-xs shrink-0">
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
                          {sale.status === 'COMPLETED' ? 'Payée' : 'Annulée'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sale.customerName} • {sale.items.length} article(s) •{' '}
                        {new Date(sale.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
              <h2 className="text-base font-bold text-slate-900">Traçabilité des Mouvements de Stock</h2>
              <p className="text-xs text-slate-500">Entrées arrivages, décrémentations caisse, avaries</p>
            </div>
            <button
              onClick={() => navigate('/stock')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir le journal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Aucun mouvement de stock récent</p>
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
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            mvt.type === 'PURCHASE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mvt.type === 'SALE'
                              ? 'bg-rose-100 text-rose-800'
                              : mvt.type === 'LOSS'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mvt.type === 'PURCHASE'
                            ? 'Arrivage'
                            : mvt.type === 'SALE'
                            ? 'Vente'
                            : mvt.type === 'LOSS'
                            ? 'Perte'
                            : 'Ajustement'}
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
                        Solde: {mvt.newStock}
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
