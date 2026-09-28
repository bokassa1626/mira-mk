import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Beef,
  AlertCircle,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Category, Product } from '../types/index.ts';
import { Modal } from '../components/common/Modal.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';

export const Categories: React.FC = () => {
  const { role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        api.categories.getAll(),
        api.products.getAll(),
      ]);
      setCategories(catsRes);
      setProducts(prodsRes);
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
    setEditingCategory(null);
    setFormData({ code: '', name: '', description: '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      code: cat.code,
      name: cat.name,
      description: cat.description || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMsg('Le code et le nom sont obligatoires.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (editingCategory) {
        await api.categories.update(editingCategory.id, formData);
        setSuccessMsg('Catégorie mise à jour avec succès.');
      } else {
        await api.categories.create(formData);
        setSuccessMsg('Nouvelle catégorie de viandes enregistrée.');
      }

      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const attachedCount = products.filter(p => p.categoryId === cat.id).length;
    if (attachedCount > 0) {
      alert(`Impossible de supprimer cette catégorie car ${attachedCount} produit(s) y sont rattachés.`);
      return;
    }

    if (!window.confirm(`Confirmez-vous la suppression définitive de la catégorie "${cat.name}" ?`)) {
      return;
    }

    try {
      await api.categories.delete(cat.id);
      setSuccessMsg('Catégorie supprimée avec succès.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const canManage = role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
              Organisation des viandes
            </span>
            <span className="text-xs text-slate-500">Boucherie Mira-Mk</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Familles & Catégories de Viandes
          </h1>
          <p className="text-xs text-slate-500">
            Structurez votre catalogue par espèce animale et type de découpe pour un suivi précis des ventes et marges
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-950/20 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Famille de Viande</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou code (ex: BOF, Bœuf)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filteredCategories.length} catégorie(s) configurée(s)
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie trouvée"
          description="Créez une catégorie pour regrouper vos viandes (Bœuf, Porc, Volaille, etc.)."
          icon={FolderTree}
          action={
            canManage
              ? {
                  label: 'Créer une catégorie',
                  onClick: openCreateModal,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(cat => {
            const catProducts = products.filter(p => p.categoryId === cat.id);
            const totalStockKg = catProducts.reduce((acc, p) => acc + (p.unit === 'kg' ? p.currentStock : 0), 0);
            const totalValuation = catProducts.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <Beef className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {cat.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-0.5">{cat.name}</h3>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                    {cat.description || "Aucune description renseignée pour cette catégorie."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Produits liés</span>
                    <p className="font-bold text-slate-800">{catProducts.length} référence(s)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Stock en kg</span>
                    <p className="font-bold text-slate-800">{totalStockKg} kg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ajout / Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Modifier la Famille de Viande" : "Nouvelle Famille de Viande"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Code de Catégorie (Trigramme) *
            </label>
            <input
              type="text"
              required
              placeholder="ex: BOF, PRC, CHV, VOL"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Sert de préfixe pour le codage des morceaux et découpes.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom de la Famille de Viande *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Viande de Bœuf, Porc Frais, Caprin..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Précisions sur les carcasses, origines d'élevage ou spécificités frigorifiques..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Enregistrement..." : editingCategory ? "Enregistrer" : "Créer la famille"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
