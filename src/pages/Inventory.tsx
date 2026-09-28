import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle,
  AlertTriangle,
  History,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, InventorySession } from '../types/index.ts';
import { StatCard } from '../components/common/StatCard.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';

interface PhysicalCountRow {
  productId: string;
  name: string;
  unit: string;
  purchasePrice: number;
  theoreticalStock: number;
  physicalStock: number;
  reason: string;
}

export const Inventory: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New inventory session modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [counts, setCounts] = useState<PhysicalCountRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // View details modal
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessList, prodList] = await Promise.all([
        api.inventory.getAll(),
        api.products.getAll(),
      ]);
      setSessions(sessList);
      setProducts(prodList.filter(p => p.status !== 'ARCHIVED'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startNewInventory = () => {
    const initialCounts: PhysicalCountRow[] = products.map(p => ({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      theoreticalStock: p.currentStock,
      physicalStock: p.currentStock,
      reason: '',
    }));
    setCounts(initialCounts);
    setIsModalOpen(true);
  };

  const updatePhysicalQty = (productId: string, val: number) => {
    setCounts(prev =>
      prev.map(row =>
        row.productId === productId
          ? {
              ...row,
              physicalStock: Math.max(0, val),
              reason: val !== row.theoreticalStock && !row.reason ? "Écart constaté lors du comptage physique" : row.reason,
            }
          : row
      )
    );
  };

  const updateReason = (productId: string, reason: string) => {
    setCounts(prev =>
      prev.map(row => (row.productId === productId ? { ...row, reason } : row))
    );
  };

  // Compute total discrepancy
  const totalDiscrepancyValue = counts.reduce((acc, row) => {
    const diff = row.physicalStock - row.theoreticalStock;
    return acc + diff * row.purchasePrice;
  }, 0);

  const totalDifferencesCount = counts.filter(
    r => r.physicalStock !== r.theoreticalStock
  ).length;

  const handleSubmitInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !confirm(
        `Confirmez-vous la clôture de l'inventaire physique ? Les stocks du système seront ajustés pour correspondre exactement aux comptages physiques saisis (${totalDifferencesCount} écart(s)).`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = counts.map(r => ({
        productId: r.productId,
        physicalStock: r.physicalStock,
        reason: r.reason,
      }));

      await api.inventory.create(itemsPayload);
      alert('Inventaire validé ! Les stocks ont été régularisés avec mouvements d’ajustement.');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la validation de l'inventaire.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Inventaires Physiques & Contrôle des Écarts
          </h1>
          <p className="text-xs text-slate-500">
            Comptage contradictoire en chambre froide, comparaison théorique vs physique et valorisation des écarts
          </p>
        </div>

        {role !== 'VENDEUR' && (
          <button
            onClick={startNewInventory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lancer une Séance d'Inventaire</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Sessions Réalisées"
          value={sessions.length}
          subtitle="Clôturées et enregistrées"
          icon={ClipboardCheck}
          variant="primary"
        />
        <StatCard
          title="Dernière Séance"
          value={sessions[0]?.sessionNumber || 'Aucune'}
          subtitle={sessions[0] ? new Date(sessions[0].createdAt).toLocaleDateString('fr-FR') : '—'}
          icon={History}
          variant="info"
        />
        <StatCard
          title="Rôle Superviseur Recommandé"
          value="Contrôleur"
          subtitle="Audit régulier anti-coulage"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Sessions History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Historique des Séances d'Inventaire</h2>
          <span className="text-xs text-slate-500">
            Toutes les régularisations sont historisées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">N° Séance</th>
                <th className="py-3.5 px-4">Date de Réalisation</th>
                <th className="py-3.5 px-4 text-center">Articles Contrôlés</th>
                <th className="py-3.5 px-4 text-right">Valeur Nette de l'Écart</th>
                <th className="py-3.5 px-4">Supervisé Par</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chargement des inventaires...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucune séance d'inventaire clôturée. Cliquez sur "Lancer une Séance d'Inventaire"
                    pour démarrer un comptage.
                  </td>
                </tr>
              ) : (
                sessions.map(s => {
                  const date = new Date(s.createdAt);
                  const isNegative = s.totalDifferenceValue < 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {s.sessionNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        {s.items?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span className={isNegative ? 'text-rose-600' : 'text-emerald-600'}>
                          {s.totalDifferenceValue > 0 ? '+' : ''}
                          {formatMoney(s.totalDifferenceValue)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {s.conductedByName || 'Superviseur'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success" size="sm">
                          Validé & Appliqué
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Détails des écarts
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Inventory Session */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Feuille de Comptage Physique — Chambre Froide"
        subtitle="Saisissez les quantités réelles pesées pour comparer au stock théorique"
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmitInventory} className="space-y-4 text-xs">
          {/* Summary Discrepancy Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500">Écarts constatés :</span>{' '}
              <span className="font-bold font-mono text-slate-900">
                {totalDifferencesCount} produit(s)
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Impact Financier Total :</span>{' '}
              <span
                className={`font-bold font-mono text-sm ${
                  totalDiscrepancyValue < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {totalDiscrepancyValue > 0 ? '+' : ''}
                {formatMoney(totalDiscrepancyValue)}
              </span>
            </div>
          </div>

          {/* Counts Table */}
          <div className="overflow-x-auto max-h-[50vh] border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Produit</th>
                  <th className="py-2.5 px-3 text-center">Stock Théorique</th>
                  <th className="py-2.5 px-3 text-center">Comptage Physique Réel</th>
                  <th className="py-2.5 px-3 text-center">Écart (Diff.)</th>
                  <th className="py-2.5 px-3 text-right">Valeur Écart</th>
                  <th className="py-2.5 px-3">Justification / Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {counts.map(row => {
                  const diff = row.physicalStock - row.theoreticalStock;
                  const diffVal = diff * row.purchasePrice;
                  const hasDiff = diff !== 0;

                  return (
                    <tr
                      key={row.productId}
                      className={hasDiff ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {row.theoreticalStock} {row.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.physicalStock}
                          onChange={e =>
                            updatePhysicalQty(row.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold font-mono text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {hasDiff ? (
                          <span className={diff < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {diff > 0 ? `+${diff}` : diff} {row.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {hasDiff ? (
                          <span className={diffVal < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {diffVal > 0 ? '+' : ''}
                            {formatMoney(diffVal)}
                          </span>
                        ) : (
                          <span className="text-slate-400">0 CDF</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.reason}
                          onChange={e => updateReason(row.productId, e.target.value)}
                          placeholder={hasDiff ? 'Motif de l’écart...' : 'Conforme'}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[11px] focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              ⚠️ La validation créera automatiquement les mouvements de régularisation nécessaires.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-md shadow-rose-950/20 cursor-pointer"
              >
                {submitting ? 'Validation...' : 'Valider & Mettre à jour les stocks'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Details Modal for selected session */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Détails de la Séance ${selectedSession.sessionNumber}`}
          subtitle="Comptages physiques et écarts régularisés"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Produit</th>
                    <th className="py-2.5 px-3 text-center">Théorique</th>
                    <th className="py-2.5 px-3 text-center">Physique</th>
                    <th className="py-2.5 px-3 text-center">Écart</th>
                    <th className="py-2.5 px-3 text-right">Valeur</th>
                    <th className="py-2.5 px-3">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSession.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{it.productName}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">
                        {it.theoreticalStock}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                        {it.physicalStock}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span className={it.difference < 0 ? 'text-rose-600' : it.difference > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {formatMoney(it.differenceValue)}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{it.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
