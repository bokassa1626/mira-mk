import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { Sale, Purchase, Expense, Loss, StockMovement } from '../types/index.ts';

export const Reports: React.FC = () => {
  const { formatMoney } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{
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
  } | null>(null);

  const loadReport = async (date: string) => {
    try {
      setLoading(true);
      const res = await api.reports.getDaily(date);
      setReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!report) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'BOUCHERIE MIRA-MK - RAPPORT JOURNALIER\n';
    csvContent += `Date;${report.date}\n\n`;

    csvContent += 'INDICATEUR;MONTANT (CDF)\n';
    csvContent += `Chiffre d'Affaires (Ventes);${report.summary.totalSales}\n`;
    csvContent += `Coût des Marchandises Vendues (CMV);${report.summary.totalCost}\n`;
    csvContent += `Marge Brute;${report.summary.grossMargin}\n`;
    csvContent += `Achats Réceptionnés;${report.summary.totalPurchases}\n`;
    csvContent += `Dépenses d'Exploitation;${report.summary.totalExpenses}\n`;
    csvContent += `Pertes Constatées;${report.summary.totalLosses}\n`;
    csvContent += `Bénéfice Net Estimé;${report.summary.netProfit}\n\n`;

    csvContent += 'VENTES DU JOUR\n';
    csvContent += 'Numéro;Client;Total;Marge;Paiement\n';
    report.sales.forEach(s => {
      csvContent += `${s.saleNumber};${s.customerName};${s.total};${s.grossMargin};${s.paymentMethod}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_miramk_${report.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rapport Journalier & Clôture de Caisse</h1>
          <p className="text-xs text-slate-500">
            Synthèse comptable complète : Ventes, Achats, Stocks, Dépenses et Marge réelle
          </p>
        </div>

        {/* Date Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer le Rapport</span>
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Calcul des données de clôture...
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {/* Printable Report Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Boucherie Mira-Mk • Lubumbashi
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Bilan d'Activité du{' '}
                  {new Date(report.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <p className="text-xs text-slate-500">
                  Mitipisha, Gécamines, Avenue de Kinshasa, Lubumbashi, RDC
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Résultat Net Journalier
                </span>
                <p
                  className={`text-2xl font-black font-mono ${
                    report.summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatMoney(report.summary.netProfit)}
                </p>
              </div>
            </div>

            {/* Financial Equation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-slate-500 block text-[11px]">1. Chiffre d'Affaires</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatMoney(report.summary.totalSales)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">2. Coût Marchandises</span>
                <span className="font-mono font-bold text-slate-700 text-sm">
                  -{formatMoney(report.summary.totalCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">= Marge Brute</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {formatMoney(report.summary.grossMargin)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">3. Charges & Dépenses</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  -{formatMoney(report.summary.totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">4. Pertes Avariées</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  -{formatMoney(report.summary.totalLosses)}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Sales of the day */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-rose-600" />
                <span>Ventes Enregistrées ({report.sales.length})</span>
              </h3>
              <span className="font-mono font-bold text-xs text-slate-900">
                Total : {formatMoney(report.summary.totalSales)}
              </span>
            </div>

            {report.sales.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Aucune vente pour cette date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2 px-3">N° Facture</th>
                      <th className="py-2 px-3">Client</th>
                      <th className="py-2 px-3 text-center">Articles</th>
                      <th className="py-2 px-3 text-right">Total Vente</th>
                      <th className="py-2 px-3 text-right">Coût Achat</th>
                      <th className="py-2 px-3 text-right">Marge Brute</th>
                      <th className="py-2 px-3">Règlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.sales.map(s => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 font-mono font-bold">{s.saleNumber}</td>
                        <td className="py-2 px-3">{s.customerName}</td>
                        <td className="py-2 px-3 text-center font-mono">{s.items.length}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatMoney(s.total)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {formatMoney(s.totalCost)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600">
                          +{formatMoney(s.grossMargin)}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">{s.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Purchases & Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchases */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Approvisionnements ({report.purchases.length})</span>
                </h3>
                <span className="font-mono font-bold text-xs text-slate-900">
                  {formatMoney(report.summary.totalPurchases)}
                </span>
              </div>
              {report.purchases.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Aucun achat ce jour.</p>
              ) : (
                <div className="space-y-2">
                  {report.purchases.map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800">{p.purchaseNumber}</span>
                        <p className="text-[11px] text-slate-500">{p.supplierName}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(p.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  <span>Charges Décaissées ({report.expenses.length})</span>
                </h3>
                <span className="font-mono font-bold text-xs text-slate-900">
                  {formatMoney(report.summary.totalExpenses)}
                </span>
              </div>
              {report.expenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Aucune dépense ce jour.</p>
              ) : (
                <div className="space-y-2">
                  {report.expenses.map(e => (
                    <div
                      key={e.id}
                      className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="max-w-xs">
                        <span className="font-bold text-slate-800">{e.category}</span>
                        <p className="text-[11px] text-slate-500 truncate">{e.description}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600">
                        {formatMoney(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
