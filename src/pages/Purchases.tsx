import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Building2,
  Calendar,
  CheckCircle,
  Truck,
  Trash2,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Purchase, Product, Supplier, PaymentMethod } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

interface PurchaseFormItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const Purchases: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New purchase modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [items, setItems] = useState<PurchaseFormItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchList, prodList, supList] = await Promise.all([
        api.purchases.getAll(),
        api.products.getAll(),
        api.purchases.getSuppliers(),
      ]);
      setPurchases(purchList);
      setProducts(prodList.filter(p => p.status !== 'ARCHIVED'));
      setSuppliers(supList);
      if (supList.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supList[0].id);
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

  const openNewPurchaseModal = () => {
    if (products.length === 0) {
      alert("Veuillez d'abord créer des produits au catalogue.");
      return;
    }
    setItems([{ productId: products[0].id, quantity: 50, unitPrice: products[0].purchasePrice }]);
    setDiscount(0);
    setAmountPaid('');
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (products.length > 0) {
      setItems(prev => [
        ...prev,
        { productId: products[0].id, quantity: 20, unitPrice: products[0].purchasePrice },
      ]);
    }
  };

  const updateItemRow = (index: number, field: keyof PurchaseFormItem, val: any) => {
    setItems(prev => {
      const copy = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === val);
        copy[index] = {
          ...copy[index],
          productId: val,
          unitPrice: prod ? prod.purchasePrice : copy[index].unitPrice,
        };
      } else {
        copy[index] = { ...copy[index], [field]: Number(val) };
      }
      return copy;
    });
  };

  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const effectivePaid = amountPaid === '' ? total : Number(amountPaid) || 0;
  const remainingDebt = Math.max(0, total - effectivePaid);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || items.length === 0) {
      alert('Veuillez sélectionner un fournisseur et au moins un article.');
      return;
    }

    try {
      await api.purchases.create({
        supplierId: selectedSupplierId,
        items,
        paymentMethod,
        discount: Number(discount) || 0,
        amountPaid: effectivePaid,
        currency: 'CDF',
      });
      alert('Achat validé avec succès ! Le stock des produits a été augmenté automatiquement.');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'enregistrement de l'achat.");
    }
  };

  const filteredPurchases = purchases.filter(
    p =>
      p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Achats & Réceptions de Viandes</h1>
          <p className="text-xs text-slate-500">
            Approvisionnements de carcasses et viandes avec augmentation atomique du stock
          </p>
        </div>

        {role !== 'VENDEUR' && (
          <button
            onClick={openNewPurchaseModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Réceptionner un Achat</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher par numéro d'achat, fournisseur..."
      />

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">N° Bon Achat</th>
                <th className="py-3.5 px-4">Date Réception</th>
                <th className="py-3.5 px-4">Fournisseur</th>
                <th className="py-3.5 px-4 text-center">Articles Réceptionnés</th>
                <th className="py-3.5 px-4 text-right">Montant Total</th>
                <th className="py-3.5 px-4 text-right">Montant Payé</th>
                <th className="py-3.5 px-4 text-right">Reste Dû (Dette)</th>
                <th className="py-3.5 px-4">Paiement</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chargement des approvisionnements...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucun achat enregistré.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(p => {
                  const date = new Date(p.createdAt);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.purchaseNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {date.toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {p.supplierName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-medium text-slate-700">
                          {p.items.length} produit(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(p.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {formatMoney(p.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {p.remainingAmount > 0 ? (
                          <span className="text-amber-700">+{formatMoney(p.remainingAmount)}</span>
                        ) : (
                          <span className="text-slate-400">0 CDF</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success" size="sm">
                          Validé & En Stock
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Réceptionner un Achat */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle Réception Marchandise"
        subtitle="Entrée en stock avec mise à jour automatique des quantités"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fournisseur *</label>
              <select
                required
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mode de règlement *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="CASH">Espèces (Cash)</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="M_PESA">M-Pesa</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="BANK_TRANSFER">Virement Bancaire</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Articles Livrés (Viandes)</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 items-center"
                >
                  <div className="col-span-5">
                    <select
                      value={row.productId}
                      onChange={e => updateItemRow(idx, 'productId', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qté"
                      value={row.quantity}
                      onChange={e => updateItemRow(idx, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Prix Achat"
                      value={row.unitPrice}
                      onChange={e => updateItemRow(idx, 'unitPrice', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remise obtenue (CDF)</label>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Montant payé au fournisseur (CDF)
              </label>
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={total.toString()}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>TOTAL FACTURÉ :</span>
              <span className="font-mono text-rose-600">{formatMoney(total)}</span>
            </div>
            {remainingDebt > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Dette fournisseur restante :</span>
                <span className="font-mono">+{formatMoney(remainingDebt)}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
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
              Valider la Réception & Augmenter le Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
