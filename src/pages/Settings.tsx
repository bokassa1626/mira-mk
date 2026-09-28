import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, MapPin, Phone, Mail, DollarSign } from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CompanySettings } from '../types/index.ts';

export const Settings: React.FC = () => {
  const { role } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.settings.get();
        setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.settings.update(settings);
      alert('Paramètres de la Boucherie Mira-Mk enregistrés avec succès.');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-slate-400">Chargement...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Paramètres de l'Entreprise</h1>
        <p className="text-xs text-slate-500">
          Configuration des coordonnées officielles, devises et préfixes de facturation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-rose-600 font-bold text-sm">
          <Building2 className="w-4 h-4" />
          <span>Identité Légale & Adresse</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nom de l'Entreprise *</label>
            <input
              type="text"
              required
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adresse Complète *</label>
            <input
              type="text"
              required
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Téléphones de Contact</label>
            <input
              type="text"
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Officiel</label>
            <input
              type="email"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="border-b border-slate-100 pt-4 pb-3 flex items-center gap-2 text-rose-600 font-bold text-sm">
          <DollarSign className="w-4 h-4" />
          <span>Devises & Facturation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Devise Principale</label>
            <input
              type="text"
              disabled
              value={settings.currency}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Taux de Change (CDF pour 1 USD) *</label>
            <input
              type="number"
              required
              min="1000"
              value={settings.exchangeRate}
              onChange={e => setSettings({ ...settings, exchangeRate: Number(e.target.value) || 2850 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Préfixe des Factures *</label>
            <input
              type="text"
              required
              value={settings.invoicePrefix}
              onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Seuil d'Alerte Stock par Défaut (kg)</label>
          <input
            type="number"
            min="1"
            value={settings.defaultStockThreshold}
            onChange={e => setSettings({ ...settings, defaultStockThreshold: Number(e.target.value) || 20 })}
            className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {role === 'ADMINISTRATEUR' ? (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les Paramètres'}</span>
            </button>
          </div>
        ) : (
          <p className="text-amber-700 text-xs italic">
            * Seul un Administrateur peut modifier ces paramètres.
          </p>
        )}
      </form>
    </div>
  );
};
