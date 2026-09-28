# Architecture Technique — Boucherie Mira-Mk

## 1. Contexte & Identité
- **Entreprise** : Boucherie Mira-Mk
- **Siège / Adresse** : Mitipisha, Gécamines, Avenue de Kinshasa, Lubumbashi, Haut-Katanga, RDC
- **Objectif** : Remplacer la tenue manuelle de cahiers par un système professionnel, fiable, moderne et sécurisé pour le pilotage complet des flux de viandes (Bœuf, Porc, Chèvre, Volaille, Abats, Saucisses), trésorerie en Francs Congolais (CDF) et USD, inventaires et traçabilité.

---

## 2. Diagramme d'Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │             Frontend React.js (SPA)                    │
       │   - React 19, TypeScript, Tailwind CSS, Lucide React   │
       │   - Recharts pour statistiques et graphiques           │
       │   - Context API pour Authentification RBAC & Devises   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   │ HTTPS / REST API
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Backend Node.js + Express.js               │
       │   - Middlewares : Helmet, CORS, Rate Limit, Auth RBAC  │
       │   - Contrôleurs métier modulaires                      │
       │   - Calculs financiers et contrôles de stock serveurs  │
       │   - Journalisation immuable d'audit                    │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   │ Firebase Admin SDK
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Google Cloud Firestore                     │
       │   - Base de données NoSQL distribuée                   │
       │   - Règles de sécurité firestore.rules (ABAC)          │
       │   - Collections sécurisées & transactions atomiques    │
       └────────────────────────────────────────────────────────┘
```

---

## 3. Séparation des Responsabilités (Zero-Trust Frontend)
- **Le frontend React** ne manipule jamais de logique financière ni de secrets d'infrastructure.
- **Le backend Node.js + Express** :
  1. Vérifie le token Firebase ou le rôle de l'utilisateur.
  2. Valide les entrées requises.
  3. Vérifie la disponibilité physique du stock avant d'autoriser une vente.
  4. Réalise le décrément/incrément automatique et génère le mouvement dans `stock_movements`.
  5. Calcule la marge commerciale brute (`Prix de vente - Prix d'achat`) et le bénéfice net (`Marge brute - Dépenses - Pertes`).
  6. Écrit systématiquement dans `audit_logs`.

---

## 4. Matrice des Rôles & Permissions (RBAC)

| Module / Ressource | ADMINISTRATEUR | GESTIONNAIRE | VENDEUR / CAISSIER | CONTRÔLEUR |
| :--- | :---: | :---: | :---: | :---: |
| **Tableau de Bord** | Accès Total | Opérationnel | Caisse & Alertes | Contrôle & Stocks |
| **Caisse & Ventes (POS)** | Lecture / Écriture / Annulation | Lecture | Vente directe | Lecture |
| **Factures** | Émission / Consultation / PDF | Consultation | Émission / Consultation | Consultation |
| **Viandes & Produits** | CRUD Complet | CRUD | Consultation restreinte | Lecture / Contrôle |
| **Familles & Catégories**| CRUD Complet | CRUD | Lecture | Lecture |
| **Stocks & Chambres Froides** | Lecture / Ajustement | Lecture / Ajustement | Lecture seule | Contrôle physique |
| **Achats & Réceptions** | Validation & Saisie | Validation & Saisie | Aucun | Consultation |
| **Fournisseurs** | CRUD Complet | CRUD | Aucun | Aucun |
| **Dépenses & Charges** | CRUD | Saisie | Aucun | Contrôle |
| **Inventaires Physiques** | Clôture & Validation | Saisie comptage | Aucun | Inventaire contradictoire |
| **Pertes & Avaries** | Approbation finale | Déclaration / Approbation | Déclaration | Constat & Contrôle |
| **Alertes Stocks** | Traitement | Traitement | Consultation | Contrôle |
| **Rapports & Clôtures** | Clôture financière | Rapports stocks | Clôture de caisse | Rapports d'écarts |
| **Journal d'Audit** | Consultation complète | Aucun | Aucun | Consultation |
| **Utilisateurs & Accès** | Gestion des comptes | Aucun | Aucun | Aucun |
| **Paramètres Généraux** | Modification | Aucun | Aucun | Aucun |

---

## 5. Formules de Calcul Métier
1. **Stock Actuel** :
   $$\text{Stock Final} = \text{Stock Initial} + \text{Achats Réceptionnés} - \text{Ventes Validées} - \text{Pertes Approuvées} \pm \text{Ajustements Validés}$$
2. **Valorisation du Stock** :
   $$\text{Valeur Totale} = \sum (\text{Stock Actuel}_i \times \text{Prix d'Achat}_i)$$
3. **Chiffre d'Affaires Brut (CA)** :
   $$\text{CA} = \sum (\text{Ventes Validées})$$
4. **Marge Commerciale Brute** :
   $$\text{Marge Brute} = \text{CA} - \text{Coût des Marchandises Vendues (CMV)}$$
   $$\text{avec } CMV = \sum (\text{Quantité Vendue}_i \times \text{Prix d'Achat}_i)$$
5. **Bénéfice Net Estimé** :
   $$\text{Bénéfice Net} = \text{Marge Brute} - \text{Dépenses d'Exploitation} - \text{Valeur des Pertes}$$
