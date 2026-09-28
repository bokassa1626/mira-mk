import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Zap,
  Droplet,
  Truck,
  Sparkles,
  Users,
  Box,
  FileText,
  CreditCard,
  Calendar
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Expense, ExpenseCategory, PaymentMethod } from '../types/index.ts';
import { StatCard } from '../components/common/StatCard.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const Expenses: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('ELECTRICITE_CARBURANT');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.expenses.getAll();
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      alert('Veuillez saisir un motif et un montant.');
      return;
    }

    try {
      await api.expenses.create({
        category,
        description,
        amount: Number(amount),
        paymentMethod,
        reference,
        currency: 'CDF',
      });
      alert('Dépense enregistrée et déduite des bénéfices.');
      setIsModalOpen(false);
      setDescription('');
      setAmount('');
      setReference('');
      loadExpenses();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const categoriesConfig: Record<
    ExpenseCategory,
    { label: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    ELECTRICITE_CARBURANT: { label: 'Électricité & Carburant Groupe', icon: Zap },
    ENTRETIEN_HYGIENE: { label: 'Entretien & Hygiène Boucherie', icon: Sparkles },
    TRANSPORT: { label: 'Transport & Fret Viandes', icon: Truck },
    EAU: { label: 'Eau & Assainissement', icon: Droplet },
    SALAIRES: { label: 'Salaires & Primes Équipe', icon: Users },
    MATERIEL_EMBALLAGE: { label: 'Emballages & Petit Matériel', icon: Box },
    ADMINISTRATION: { label: 'Frais Administratifs & Taxes', icon: FileText },
    AUTRES: { label: 'Autres Charges', icon: DollarSign },
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesCat = selectedCat === 'ALL' || e.category === selectedCat;
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.reference && e.reference.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dépenses & Charges d'Exploitation</h1>
          <p className="text-xs text-slate-500">
            Enregistrement des coûts opérationnels (électricité groupe froid, emballages, salaires)
          </p>
        </div>

        {role !== 'VENDEUR' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer une Dépense</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total des Charges Enregistrées"
          value={formatMoney(totalExpenses)}
          subtitle="Déductible de la marge brute"
          icon={DollarSign}
          variant="danger"
        />
        <StatCard
          title="Nombre de Dépenses"
          value={expenses.length}
          subtitle="Toutes catégories confondues"
          icon={FileText}
          variant="neutral"
        />
        <StatCard
          title="Poste de Charge Principal"
          value="Énergie Froid"
          subtitle="Carburant groupe électrogène"
          icon={Zap}
          variant="warning"
        />
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une charge, facture ou référence..."
        statuses={Object.entries(categoriesConfig).map(([key, cfg]) => ({
          value: key,
          label: cfg.label,
        }))}
        selectedStatus={selectedCat}
        onStatusChange={setSelectedCat}
      />

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4">Motif & Description</th>
                <th className="py-3.5 px-4">Justificatif / Réf.</th>
                <th className="py-3.5 px-4 text-right">Montant</th>
                <th className="py-3.5 px-4">Mode Règlement</th>
                <th className="py-3.5 px-4 text-right">Engagé Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chargement des dépenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucune dépense enregistrée.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => {
                  const date = new Date(e.createdAt);
                  const cfg = categoriesConfig[e.category] || {
                    label: e.category,
                    icon: DollarSign,
                  };
                  const Icon = cfg.icon;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {date.toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <Icon className="w-3 h-3 text-slate-500" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">
                        {e.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {e.reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 text-sm">
                        {formatMoney(e.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {e.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                        {e.createdByName || 'Gérant'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Saisie Dépense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer une Dépense d'Exploitation"
        subtitle="Impacte directement le calcul du bénéfice net"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catégorie de Charge *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              {Object.entries(categoriesConfig).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description / Motif de la dépense *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: 50 litres de gazole pour groupe électrogène de la chambre froide..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Montant (CDF) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 145000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Règlement *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="CASH">Espèces</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="M_PESA">M-Pesa</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="BANK_TRANSFER">Virement Bancaire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Numéro de reçu ou quittance (Optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex: TICKET-STATION-8991"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-md shadow-rose-950/20 cursor-pointer"
            >
              Enregistrer la Dépense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
