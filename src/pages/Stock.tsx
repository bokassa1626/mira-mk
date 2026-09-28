import React, { useState, useEffect } from 'react';
import {
  Package,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, StockMovement, StockMovementType } from '../types/index.ts';
import { StatCard } from '../components/common/StatCard.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const Stock: React.FC = () => {
  const { formatMoney, role } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalValuation: 0,
    totalWeightKg: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Tab switch: 'levels' vs 'movements'
  const [activeTab, setActiveTab] = useState<'levels' | 'movements'>('levels');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');

  // Modal Adjustment
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustTargetStock, setAdjustTargetStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const loadStockData = async () => {
    try {
      setLoading(true);
      const [overview, mvts] = await Promise.all([
        api.stock.getOverview(),
        api.stock.getMovements(),
      ]);
      setProducts(overview.products);
      setSummary(overview.summary);
      setMovements(mvts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, []);

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustTargetStock(product.currentStock.toString());
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustTargetStock === '' || !adjustReason) {
      alert('Veuillez spécifier la nouvelle quantité et un motif obligatoire.');
      return;
    }

    try {
      await api.stock.adjust(selectedProduct.id, Number(adjustTargetStock), adjustReason);
      alert('Ajustement de stock enregistré et tracé dans la piste daudit.');
      setIsAdjustModalOpen(false);
      loadStockData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'ajustement.");
    }
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovements = movements.filter(m => {
    const matchesType = movementTypeFilter === 'ALL' || m.type === movementTypeFilter;
    const matchesSearch =
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.reason.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestion & Contrôle des Stocks</h1>
          <p className="text-xs text-slate-500">
            Formule mathématique : Stock final = Stock initial + Entrées - Ventes - Pertes ± Ajustements
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Niveaux de Stock & Valeurs
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'movements'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Journal des Mouvements ({movements.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Valeur Marchande du Stock"
          value={formatMoney(summary.totalValuation)}
          subtitle="Au prix d'achat fournisseur"
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Poids Total en Chambre Froide"
          value={`${summary.totalWeightKg} kg`}
          subtitle="Viandes pesées à Lubumbashi"
          icon={SlidersHorizontal}
          variant="info"
        />
        <StatCard
          title="Articles en Stock Faible"
          value={summary.lowStockCount}
          subtitle="Stock ≤ seuil de réapprovisionnement"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Ruptures Constatées"
          value={summary.outOfStockCount}
          subtitle="Stock épuisé (= 0 kg)"
          icon={AlertTriangle}
          variant={summary.outOfStockCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* TAB 1: Stock Levels */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Rechercher une viande par nom ou code..."
          />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3.5 px-4">Référence</th>
                    <th className="py-3.5 px-4">Désignation</th>
                    <th className="py-3.5 px-4 text-center">Stock Initial</th>
                    <th className="py-3.5 px-4 text-center">Stock Actuel</th>
                    <th className="py-3.5 px-4 text-center">Seuil Min.</th>
                    <th className="py-3.5 px-4 text-right">Prix d'Achat</th>
                    <th className="py-3.5 px-4 text-right">Valeur du Stock</th>
                    <th className="py-3.5 px-4 text-center">Statut</th>
                    {role !== 'VENDEUR' && <th className="py-3.5 px-4 text-right">Ajustement</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Chargement des stocks...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Aucun produit trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const totalVal = p.currentStock * p.purchasePrice;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{p.code}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block">Unité: {p.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                            {p.initialStock} {p.unit}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                            {p.currentStock} {p.unit}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                            {p.minimumStock} {p.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {formatMoney(p.purchasePrice)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatMoney(totalVal)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {p.currentStock <= 0 ? (
                              <Badge variant="danger" size="sm">
                                Rupture
                              </Badge>
                            ) : p.currentStock <= p.minimumStock ? (
                              <Badge variant="warning" size="sm">
                                Stock Faible
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Normal
                              </Badge>
                            )}
                          </td>
                          {role !== 'VENDEUR' && (
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => openAdjustModal(p)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors cursor-pointer"
                              >
                                Ajuster
                              </button>
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
        </div>
      )}

      {/* TAB 2: Movements Log */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Rechercher par viande, motif..."
            statuses={[
              { value: 'PURCHASE', label: 'Achats / Entrées (+)' },
              { value: 'SALE', label: 'Ventes / Sorties (-)' },
              { value: 'LOSS', label: 'Pertes constatées (-)' },
              { value: 'ADJUSTMENT', label: 'Ajustements manuels (±)' },
              { value: 'INVENTORY', label: 'Inventaires physiques (±)' },
              { value: 'RETURN', label: 'Retours / Annulations (+)' },
            ]}
            selectedStatus={movementTypeFilter}
            onStatusChange={setMovementTypeFilter}
          />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3.5 px-4">Date / Heure</th>
                    <th className="py-3.5 px-4">Produit</th>
                    <th className="py-3.5 px-4 text-center">Type Mouvement</th>
                    <th className="py-3.5 px-4 text-center">Variation (Qté)</th>
                    <th className="py-3.5 px-4 text-center">Stock Précédent</th>
                    <th className="py-3.5 px-4 text-center">Nouveau Stock</th>
                    <th className="py-3.5 px-4">Motif & Référence</th>
                    <th className="py-3.5 px-4 text-right">Auteur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Aucun mouvement de stock enregistré.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map(m => {
                      const isPositive = m.quantity > 0;
                      const date = new Date(m.createdAt);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {date.toLocaleDateString('fr-FR')}{' '}
                            <span className="text-[10px] text-slate-400">
                              {date.toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{m.productName}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                m.type === 'PURCHASE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.type === 'SALE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : m.type === 'LOSS'
                                  ? 'bg-red-100 text-red-800'
                                  : m.type === 'INVENTORY'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td
                            className={`py-3.5 px-4 text-center font-mono font-bold text-sm ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                            {m.previousStock}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                            {m.newStock}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{m.reason}</td>
                          <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                            {m.userName || 'Système'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Ajustement de Stock : ${selectedProduct?.name}`}
        subtitle="Régularisation exceptionnelle avec motif obligatoire"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between text-slate-600 mb-1">
              <span>Stock actuel enregistré :</span>
              <span className="font-mono font-bold text-slate-900">
                {selectedProduct?.currentStock} {selectedProduct?.unit}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Seuil minimum d'alerte :</span>
              <span className="font-mono">{selectedProduct?.minimumStock} {selectedProduct?.unit}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nouveau stock réel constaté ({selectedProduct?.unit}) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={adjustTargetStock}
              onChange={e => setAdjustTargetStock(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motif obligatoire de l'ajustement *
            </label>
            <textarea
              required
              rows={3}
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              placeholder="Ex: Correction suite à pesée de contrôle contradictoire du 28/09..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-md shadow-rose-950/20 transition-all cursor-pointer"
            >
              Valider l'ajustement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
