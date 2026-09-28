# Boucherie Mira-Mk — Système de Gestion et de Contrôle

Système complet et professionnel de gestion commerciale, comptable et logistique développé pour la **Boucherie Mira-Mk**, située à Lubumbashi, République Démocratique du Congo.

---

## 1. Présentation du Projet
- **Entreprise** : Boucherie Mira-Mk
- **Localisation** : Mitipisha, Gécamines, Avenue de Kinshasa, Lubumbashi, Haut-Katanga, RDC
- **Devises** : Franc Congolais (CDF) en monnaie principale, avec contre-valeur USD calculée en temps réel.
- **Rôle du système** : Remplacer les registres papier par une solution web sécurisée, automatisant le suivi des viandes (Bœuf, Porc, Chèvre, Volaille, Abats, Saucisses), les stocks en chambre froide, les achats, les ventes au comptoir, les marges, les inventaires physiques, les pertes et l'audit.

---

## 2. Technologies Utilisées
- **Frontend** : React 19, React Router, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend** : Node.js, Express.js, Firebase Admin SDK.
- **Base de données** : Google Cloud Firestore (`ai-studio-739c4c71-b43d-4bba-9089-9b4f1895edaf`).
- **Sécurité** : Helmet, CORS strict, Rate Limiting, RBAC (Role-Based Access Control), firestore.rules ABAC.

---

## 3. Architecture du Projet
```text
boucherie-mira-mk/
├── src/                      # Frontend React
│   ├── components/           # Composants réutilisables (DataTable, StatCard, Modal, Pagination...)
│   ├── context/              # Contextes Auth & Devises
│   ├── pages/                # Pages métier (Dashboard, Sales, Products, Categories, Stock...)
│   ├── services/             # Client API REST et Firebase
│   └── types/                # Types TypeScript
├── backend/                  # Backend Node.js / Express
│   ├── config/               # Configuration Firebase Admin & Firestore
│   ├── controllers/          # Contrôleurs métier REST
│   ├── middlewares/          # Auth, RBAC, Rate Limiting, Error Handling
│   └── routes/               # Définition des routes modulaires
├── docs/                     # Documentation technique
│   ├── architecture.md       # Diagramme et logique financière
│   ├── firestore.md          # Schémas des collections Firestore
│   └── api.md                # Référence de l'API REST
├── firestore.rules           # Règles de sécurité Firestore
├── firebase-blueprint.json   # Blueprint des entités Firestore
└── README.md                 # Guide d'utilisation
```

---

## 4. Comptes de Test & Rôles RBAC

L'application intègre un sélecteur rapide de profil sur l'écran `/login` pour tester chaque rôle :

| Rôle | Utilisateur | Email | Missions & Périmètre |
| :--- | :--- | :--- | :--- |
| **ADMINISTRATEUR** | Bokassa Ntwali | `admin@miramk.cd` | Direction générale, contrôle de caisse, clôtures, paramètres, audit. |
| **GESTIONNAIRE** | Moïse Kalala | `gestionnaire@miramk.cd`| Gestion des viandes, réceptions d'arrivages, états des stocks et fournisseurs. |
| **VENDEUR** | Rachel Mwamba | `vendeur@miramk.cd` | Encaissement au comptoir (POS), émission de factures, consultation du stock. |
| **CONTRÔLEUR** | Patrick Ilunga | `controleur@miramk.cd` | Inventaires contradictoires, approbation des pertes, audit des écarts. |

---

## 5. Démarrage Rapide

### Installation des dépendances :
```bash
npm install
```

### Lancement du serveur de développement (Full-Stack sur le port 3000) :
```bash
npm run dev
```

### Construction pour production :
```bash
npm run build
```

---

## 6. Règles Métier & Garanties du Système
1. **Contrôle strict des stocks** : Une vente ne peut jamais être validée si la quantité demandée dépasse le stock physique en chambre froide.
2. **Double devise** : Prise en charge simultanée du CDF et du dollar américain avec taux de change paramétrable dans les Paramètres.
3. **Calcul financier exact** : La marge commerciale est calculée par différence entre le prix de vente et le coût d'achat réel du lot, sans approximation de trésorerie brute.
4. **Audit immuable** : Toute création, modification de prix, ajustement ou annulation est enregistrée de manière irréversible dans `audit_logs`.
