import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  CheckCircle,
  Eye,
  Calendar,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Sale } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { InvoiceModal } from '../components/invoices/InvoiceModal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const Invoices: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await api.sales.getAll();
      setSales(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleCancelSale = async (sale: Sale) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir annuler la vente ${sale.saleNumber} ? Les viandes vendues seront réintégrées dans les stocks de la boucherie.`
      )
    ) {
      return;
    }

    try {
      await api.sales.cancel(sale.id);
      alert(`Vente ${sale.saleNumber} annulée et stocks restitués.`);
      loadSales();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'annulation.");
    }
  };

  const filteredSales = sales.filter(s => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch =
      s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registre des Factures Émises</h1>
          <p className="text-xs text-slate-500">
            Historique complet des tickets de caisse et factures de la Boucherie Mira-Mk
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher par numéro de facture ou client..."
        statuses={[
          { value: 'COMPLETED', label: 'Validées' },
          { value: 'CANCELLED', label: 'Annulées' },
        ]}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">N° Facture</th>
                <th className="py-3.5 px-4">Date & Heure</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4 text-center">Articles</th>
                <th className="py-3.5 px-4">Paiement</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Marge Brute</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chargement des factures...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const date = new Date(sale.createdAt);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {sale.saleNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div>{date.toLocaleDateString('fr-FR')}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {date.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {sale.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {sale.items.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(sale.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                        +{formatMoney(sale.grossMargin)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {sale.status === 'COMPLETED' ? 'Validée' : 'Annulée'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsInvoiceOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Aperçu & Imprimer Facture"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {role === 'ADMINISTRATEUR' && sale.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleCancelSale(sale)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Annuler la vente et restituer le stock"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={selectedSale}
      />
    </div>
  );
};
