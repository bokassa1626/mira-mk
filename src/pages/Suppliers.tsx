import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Supplier } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { SearchFilterBar } from '../components/common/SearchFilterBar.tsx';

export const Suppliers: React.FC = () => {
  const { formatMoney, role } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Lubumbashi');
  const [contactPerson, setContactPerson] = useState('');

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.purchases.getSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Nom et téléphone requis.');
      return;
    }

    try {
      await api.purchases.createSupplier({
        name,
        phone,
        email,
        address,
        contactPerson,
      });
      alert('Fournisseur enregistré avec succès.');
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setContactPerson('');
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création.');
    }
  };

  const filteredSuppliers = suppliers.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fournisseurs de Bétail & Viandes</h1>
          <p className="text-xs text-slate-500">
            Éleveurs, fermes agro-pastorales et abattoirs partenaires à Lubumbashi et Haut-Katanga
          </p>
        </div>

        {role !== 'VENDEUR' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Fournisseur</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher par raison sociale, interlocuteur..."
      />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-3 text-center py-12 text-xs text-slate-400">
            Chargement des fournisseurs...
          </p>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Aucun fournisseur répertorié.
          </div>
        ) : (
          filteredSuppliers.map(s => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                    {s.status === 'ACTIVE' ? 'Partenaire Actif' : 'Inactif'}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-tight mb-1">{s.name}</h3>

                <div className="space-y-1 text-xs text-slate-600 mt-3">
                  {s.contactPerson && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact : {s.contactPerson}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Total Acheté
                  </span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {formatMoney(s.totalPurchases)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Solde Dû
                  </span>
                  <p
                    className={`font-mono font-bold mt-0.5 ${
                      s.totalDebt > 0 ? 'text-amber-700' : 'text-emerald-600'
                    }`}
                  >
                    {s.totalDebt > 0 ? formatMoney(s.totalDebt) : '0 CDF (À jour)'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un Partenaire Fournisseur"
        subtitle="Répertoire des élevages et abattoirs"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Raison Sociale / Nom de l'élevage *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Ferme Agro-Pastorale Kasumbalesa"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Téléphone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+243 990 000 000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Personne de contact</label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="Ex: M. Kabange"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@ferme.cd"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse / Localisation à Lubumbashi
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ex: Route Kipushi km 12, Lubumbashi"
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
              Enregistrer Fournisseur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
