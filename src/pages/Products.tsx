import React, { useState, useEffect } from 'react';
import {
  Beef,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle,
  Tag
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Category, Supplier } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const Products: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    unit: 'kg' as 'kg' | 'pièce' | 'carton' | 'paquet',
    purchasePrice: '',
    sellingPrice: '',
    initialStock: '',
    minimumStock: '15',
    supplierId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats, sups] = await Promise.all([
        api.products.getAll(),
        api.products.getCategories(),
        api.purchases.getSuppliers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      categoryId: categories[0]?.id || '',
      unit: 'kg',
      purchasePrice: '',
      sellingPrice: '',
      initialStock: '0',
      minimumStock: '15',
      supplierId: suppliers[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      categoryId: p.categoryId,
      unit: p.unit,
      purchasePrice: p.purchasePrice.toString(),
      sellingPrice: p.sellingPrice.toString(),
      initialStock: p.initialStock.toString(),
      minimumStock: p.minimumStock.toString(),
      supplierId: p.supplierId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.categoryId) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, {
          name: formData.name,
          code: formData.code,
          categoryId: formData.categoryId,
          unit: formData.unit,
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          minimumStock: Number(formData.minimumStock),
          supplierId: formData.supplierId || undefined,
        });
        alert('Produit mis à jour avec succès.');
      } else {
        await api.products.create({
          name: formData.name,
          code: formData.code,
          categoryId: formData.categoryId,
          unit: formData.unit,
          purchasePrice: Number(formData.purchasePrice),
          sellingPrice: Number(formData.sellingPrice),
          initialStock: Number(formData.initialStock) || 0,
          minimumStock: Number(formData.minimumStock) || 15,
          supplierId: formData.supplierId || undefined,
        });
        alert('Nouveau produit ajouté au catalogue.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde.');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Confirmez-vous l'archivage du produit "${name}" ?`)) {
      try {
        await api.products.delete(id);
        loadData();
      } catch (e: any) {
        alert(e.message || "Erreur lors de l'archivage.");
      }
    }
  };

  const filteredProducts = products.filter(p => {
    if (p.status === 'ARCHIVED') return false;
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catalogue des Viandes & Produits</h1>
          <p className="text-xs text-slate-500">
            Gestion des fiches articles, seuils de stock minimum et tarifs d'achat/vente
          </p>
        </div>

        {role !== 'VENDEUR' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher par référence, désignation..."
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        statuses={[
          { value: 'AVAILABLE', label: 'En stock normal' },
          { value: 'LOW_STOCK', label: 'Stock faible' },
          { value: 'OUT_OF_STOCK', label: 'Rupture' },
        ]}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Désignation</th>
                <th className="py-3.5 px-4">Famille</th>
                <th className="py-3.5 px-4 text-right">Prix Achat</th>
                <th className="py-3.5 px-4 text-right">Prix Vente</th>
                <th className="py-3.5 px-4 text-right">Marge Unitaire</th>
                <th className="py-3.5 px-4 text-center">Stock Actuel</th>
                <th className="py-3.5 px-4 text-center">Seuil Min.</th>
                <th className="py-3.5 px-4 text-center">État</th>
                {role !== 'VENDEUR' && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Chargement des viandes...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Aucun produit trouvé.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  const unitMargin = p.sellingPrice - p.purchasePrice;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{p.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400">Unité : {p.unit}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          {cat ? cat.name : 'Non classé'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatMoney(p.purchasePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(p.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                        +{formatMoney(unitMargin)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.currentStock <= 0 ? (
                          <Badge variant="danger" size="sm">
                            Rupture (0)
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier les informations"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {role === 'ADMINISTRATEUR' && (
                              <button
                                onClick={() => handleArchive(p.id, p.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Archiver ce produit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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

      {/* Modal Add / Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Modifier ${editingProduct.name}` : 'Ajouter une Nouvelle Viande'}
        subtitle="Catalogue Boucherie Mira-Mk"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Code / Référence *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: BOF-005"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Famille / Catégorie *</label>
              <select
                required
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Désignation du Produit *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: T-Bone Steak de Bœuf Frais"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unité de mesure</label>
              <select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="kg">Kilogramme (kg)</option>
                <option value="pièce">Pièce / Carcasse</option>
                <option value="carton">Carton</option>
                <option value="paquet">Paquet / Sachet</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prix d'Achat (CDF) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.purchasePrice}
                onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="15000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prix de Vente (CDF) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="20000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!editingProduct && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Initial</label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialStock}
                  onChange={e => setFormData({ ...formData, initialStock: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Seuil Alerte Stock Minimum *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.minimumStock}
                onChange={e => setFormData({ ...formData, minimumStock: e.target.value })}
                placeholder="15"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fournisseur habituel (Optionnel)
            </label>
            <select
              value={formData.supplierId}
              onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="">Aucun fournisseur attitré</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-md shadow-rose-950/20 transition-all cursor-pointer"
            >
              {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
