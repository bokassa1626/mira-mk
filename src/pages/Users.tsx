import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Shield, Mail, Phone, CheckCircle, Edit3 } from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Role } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';

export const Users: React.FC = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState<Role>('VENDEUR');

  // Modal edit role
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<Role>('VENDEUR');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert('Veuillez remplir les informations requises.');
      return;
    }

    try {
      await api.users.create({
        firstName,
        lastName,
        email,
        phone,
        role: userRole,
      });
      alert('Utilisateur créé avec succès.');
      setIsModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création.');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.users.updateRole(editingUser.uid, editRole);
      alert('Rôle mis à jour.');
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour.');
    }
  };

  const roleDescriptions: Record<Role, { title: string; desc: string; badgeVariant: any }> = {
    ADMINISTRATEUR: {
      title: 'Administrateur',
      desc: 'Accès total sans restriction à tous les modules, configurations et audits.',
      badgeVariant: 'purple',
    },
    GESTIONNAIRE: {
      title: 'Gestionnaire de Stock',
      desc: 'Gestion des produits, des stocks, des achats fournisseurs et réceptions.',
      badgeVariant: 'info',
    },
    VENDEUR: {
      title: 'Vendeur / Caissier',
      desc: 'Accès exclusif à la caisse comptoir (POS), encaissement et facturation.',
      badgeVariant: 'success',
    },
    CONTROLEUR: {
      title: 'Contrôleur de Gestion',
      desc: 'Supervision des inventaires contradictoires, pertes, anomalies et audit.',
      badgeVariant: 'warning',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Utilisateurs & Permissions RBAC</h1>
          <p className="text-xs text-slate-500">
            Gestion des comptes du personnel de la Boucherie Mira-Mk et attribution des rôles
          </p>
        </div>

        {role === 'ADMINISTRATEUR' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Utilisateur</span>
          </button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <p className="col-span-4 text-center py-12 text-xs text-slate-400">
            Chargement des utilisateurs...
          </p>
        ) : (
          users.map(u => {
            const rCfg = roleDescriptions[u.role];
            return (
              <div
                key={u.uid}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                      {u.firstName[0]}
                      {u.lastName[0]}
                    </div>
                    <Badge variant={rCfg?.badgeVariant || 'neutral'} size="sm">
                      {u.role}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">
                    {u.firstName} {u.lastName}
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </p>
                    {u.phone && (
                      <p className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.phone}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-tight">
                    {rCfg?.desc}
                  </p>
                </div>

                {role === 'ADMINISTRATEUR' && (
                  <div className="mt-4 pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditRole(u.role);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier Rôle</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Create User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau Compte Utilisateur"
        subtitle="Attribuez un rôle RBAC adapté aux responsabilités de l'employé"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Ex: Christian"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Ex: Mutombo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Professionnel *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="employe@miramk.cd"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Téléphone Lubumbashi</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+243 990 000 000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rôle Système (RBAC) *</label>
            <select
              value={userRole}
              onChange={e => setUserRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ADMINISTRATEUR">ADMINISTRATEUR (Accès total)</option>
              <option value="GESTIONNAIRE">GESTIONNAIRE (Stocks & Achats)</option>
              <option value="VENDEUR">VENDEUR / CAISSIER (Ventes & Factures)</option>
              <option value="CONTROLEUR">CONTRÔLEUR (Inventaire, Pertes, Audit)</option>
            </select>
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
              Créer Utilisateur
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Role */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Modifier le Rôle de ${editingUser.firstName} ${editingUser.lastName}`}
          subtitle="Mise à jour des privilèges d'accès"
          maxWidth="sm"
        >
          <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rôle Sélectionné</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="ADMINISTRATEUR">ADMINISTRATEUR</option>
                <option value="GESTIONNAIRE">GESTIONNAIRE</option>
                <option value="VENDEUR">VENDEUR / CAISSIER</option>
                <option value="CONTROLEUR">CONTRÔLEUR</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 cursor-pointer"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
