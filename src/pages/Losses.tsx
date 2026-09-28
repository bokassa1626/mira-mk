import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Beef,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Loss, Product, LossType } from '../types/index.ts';
import { StatCard } from '../components/common/StatCard.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const Losses: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [losses, setLosses] = useState<Loss[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal declare loss
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<LossType>('DAMAGED');
  const [reason, setReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [lossesList, prods] = await Promise.all([
        api.losses.getAll(),
        api.products.getAll(),
      ]);
      setLosses(lossesList);
      setProducts(prods.filter(p => p.status !== 'ARCHIVED'));
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !reason) {
      alert('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    try {
      await api.losses.create({
        productId: selectedProductId,
        quantity: Number(quantity),
        type,
        reason,
      });
      alert('Déclaration de perte enregistrée.');
      setIsModalOpen(false);
      setQuantity('');
      setReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la déclaration.');
    }
  };

  const handleApproveLoss = async (lossId: string) => {
    if (!confirm('Confirmez-vous l’approbation de cette perte et la diminution du stock ?')) {
      return;
    }
    try {
      await api.losses.approve(lossId);
      alert('Perte approuvée et stock ajusté.');
      loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'approbation.");
    }
  };

  const totalLossValue = losses
    .filter(l => l.status === 'APPROVED')
    .reduce((acc, l) => acc + l.totalValue, 0);

  const pendingLossesCount = losses.filter(l => l.status === 'PENDING').length;

  const typeConfig: Record<LossType, { label: string; color: string }> = {
    DAMAGED: { label: 'Avarie / Dégradation', color: 'danger' },
    EXPIRED: { label: 'Périmé / Inconsommable', color: 'danger' },
    LOST: { label: 'Perte de matière', color: 'warning' },
    THEFT_SUSPECTED: { label: 'Suspicion Vol / Coulage', color: 'danger' },
    COUNT_DIFFERENCE: { label: 'Écart de pesée', color: 'warning' },
    OTHER: { label: 'Autre anomalie', color: 'neutral' },
  };

  const filteredLosses = losses.filter(l => {
    const matchesType = typeFilter === 'ALL' || l.type === typeFilter;
    const matchesSearch =
      l.productName.toLowerCase().includes(search.toLowerCase()) ||
      l.reason.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registre des Pertes & Anomalies</h1>
          <p className="text-xs text-slate-500">
            Suivi des avaries, pertes de chaîne de froid, coulage et validation hiérarchique
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Déclarer une Perte / Avarie</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Valeur Totale des Pertes Validées"
          value={formatMoney(totalLossValue)}
          subtitle="Impact négatif direct sur le résultat"
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Pertes en Attente de Validation"
          value={pendingLossesCount}
          subtitle="Nécessite arbitrage responsable"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Contrôle & Traçabilité"
          value="Piste d'Audit"
          subtitle="Chaque perte crée un mouvement LOSS"
          icon={ShieldAlert}
          variant="info"
        />
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher par produit ou motif..."
        statuses={Object.entries(typeConfig).map(([key, cfg]) => ({
          value: key,
          label: cfg.label,
        }))}
        selectedStatus={typeFilter}
        onStatusChange={setTypeFilter}
      />

      {/* Losses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Date Déclaration</th>
                <th className="py-3.5 px-4">Produit Concerné</th>
                <th className="py-3.5 px-4 text-center">Quantité Perdue</th>
                <th className="py-3.5 px-4 text-right">Valeur Financière</th>
                <th className="py-3.5 px-4">Type de Perte</th>
                <th className="py-3.5 px-4">Motif Déclaré</th>
                <th className="py-3.5 px-4">Déclaré Par</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                {role !== 'VENDEUR' && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chargement des pertes...
                  </td>
                </tr>
              ) : filteredLosses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucune perte ou anomalie enregistrée.
                  </td>
                </tr>
              ) : (
                filteredLosses.map(l => {
                  const date = new Date(l.createdAt);
                  const cfg = typeConfig[l.type] || { label: l.type, color: 'neutral' };
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {date.toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{l.productName}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600 text-sm">
                        -{l.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                        {formatMoney(l.totalValue)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{l.reason}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {l.declaredByName || 'Opérateur'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            l.status === 'APPROVED'
                              ? 'danger'
                              : l.status === 'PENDING'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {l.status === 'APPROVED'
                            ? 'Approuvée'
                            : l.status === 'PENDING'
                            ? 'En Attente'
                            : 'Rejetée'}
                        </Badge>
                      </td>
                      {role !== 'VENDEUR' && (
                        <td className="py-3.5 px-4 text-right">
                          {l.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveLoss(l.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Approuver
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Declare Loss */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Déclaration d'une Perte ou Anomalie"
        subtitle="Constat d'avarie ou écart physique en chambre froide"
        maxWidth="md"
      >
        <form onSubmit={handleCreateLoss} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Produit concerné *</label>
            <select
              required
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock actuel: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantité perdue *</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Ex: 5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type de perte *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as LossType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motif circonstancié obligatoire *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Rupture temporaire d'électricité durant la nuit, altération constatée sur le lot..."
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
              Enregistrer la Déclaration
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
