import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Lock, ArrowRight, Beef, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Role } from '../types/index.ts';

export const Login: React.FC = () => {
  const { loginWithRole, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts: {
    role: Role;
    name: string;
    email: string;
    desc: string;
    tag: string;
    color: string;
  }[] = [
    {
      role: 'ADMINISTRATEUR',
      name: 'Bokassa Ntwali',
      email: 'admin@miramk.cd',
      desc: 'Accès total à tous les modules, configurations et clôtures.',
      tag: 'Direction',
      color: 'border-purple-200 bg-purple-50/50 hover:border-purple-400 text-purple-900',
    },
    {
      role: 'GESTIONNAIRE',
      name: 'Moïse Kalala',
      email: 'gestionnaire@miramk.cd',
      desc: 'Gestion des viandes, stocks, commandes et réceptions fournisseurs.',
      tag: 'Stocks & Achats',
      color: 'border-blue-200 bg-blue-50/50 hover:border-blue-400 text-blue-900',
    },
    {
      role: 'VENDEUR',
      name: 'Rachel Mwamba',
      email: 'vendeur@miramk.cd',
      desc: 'Caisse au comptoir, facturation directe et encaissement.',
      tag: 'Caisse & POS',
      color: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 text-emerald-900',
    },
    {
      role: 'CONTROLEUR',
      name: 'Patrick Ilunga',
      email: 'controleur@miramk.cd',
      desc: 'Inventaires contradictoires, contrôle des pertes et audit.',
      tag: 'Contrôle & Audit',
      color: 'border-amber-200 bg-amber-50/50 hover:border-amber-400 text-amber-900',
    },
  ];

  const handleSelectRole = async (targetRole: Role) => {
    setLoading(true);
    await loginWithRole(targetRole);
    setLoading(false);
    navigate('/');
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await loginWithEmail(email);
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-700 to-red-500 items-center justify-center text-white shadow-xl shadow-rose-950/60 font-black text-2xl mb-1">
            M
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Boucherie Mira-Mk
          </h1>
          <p className="text-xs text-rose-400 font-semibold tracking-wide">
            Système Central de Gestion & de Contrôle • Lubumbashi, RDC
          </p>
          <p className="text-[11px] text-slate-400">
            Mitipisha, Gécamines, Avenue de Kinshasa
          </p>
        </div>

        {/* Demo Roles Quick Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-600" />
              <span>Connexion Rapide par Rôle (Comptes Démo)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez un profil pour tester les règles d'accès RBAC
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoAccounts.map(item => (
              <button
                key={item.role}
                onClick={() => handleSelectRole(item.role)}
                disabled={loading}
                className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${item.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                      {item.tag}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 mt-1">{item.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight mt-1">{item.desc}</p>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400">{item.email}</div>
              </button>
            ))}
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                Ou connexion par identifiant
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleCustomLogin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Adresse Email Professionnelle
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: admin@miramk.cd"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              Se Connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
