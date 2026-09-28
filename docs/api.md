# Documentation API REST — Boucherie Mira-Mk

Format standard des réponses :
```json
{
  "success": true,
  "message": "Opération effectuée avec succès",
  "data": {}
}
```

Format d'erreur :
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques"
}
```

---

## 1. Authentification (`/api/auth`)
- `POST /api/auth/login` : Connexion par rôle (mode démo) ou identifiants.
- `GET /api/auth/me` : Données de l'utilisateur connecté.
- `POST /api/auth/verify-token` : Vérification du token Firebase ID.
- `POST /api/auth/session` : Création du cookie de session Firebase.
- `POST /api/auth/logout` : Déconnexion.

---

## 2. Viandes & Produits (`/api/products`)
- `GET /api/products` : Liste des produits (filtres : `category`, `search`, `status`).
- `GET /api/products/:id` : Détails d'un produit.
- `POST /api/products` : Création d'une référence de viande (Manager/Admin).
- `PUT /api/products/:id` : Modification prix, seuil d'alerte, libellé.
- `DELETE /api/products/:id` : Archivage logique.

---

## 3. Familles & Catégories (`/api/categories`)
- `GET /api/categories` : Liste des familles de viandes.
- `GET /api/categories/:id` : Détail d'une famille.
- `POST /api/categories` : Ajout d'une famille (ex: Bœuf, Porc, Chèvre).
- `PUT /api/categories/:id` : Mise à jour du nom ou trigramme.
- `DELETE /api/categories/:id` : Suppression si aucun produit rattaché.

---

## 4. Stocks & Chambres Froides (`/api/stock`)
- `GET /api/stock` : Aperçu général (valorisation totale, poids en kg, ruptures).
- `GET /api/stock/movements` : Journal des mouvements (filtres : `productId`, `type`).
- `POST /api/stock/adjust` : Ajustement manuel de stock avec motif obligatoire.

---

## 5. Ventes & Caisse (`/api/sales`)
- `GET /api/sales` : Historique des ventes et factures.
- `GET /api/sales/:id` : Détail d'une vente et ticket.
- `POST /api/sales` : Enregistrement d'une vente (vérifie le stock physique disponible, le décrémente automatiquement et enregistre le mouvement).
- `POST /api/sales/:id/cancel` : Annulation d'une vente et réincrémentation du stock.

---

## 6. Achats & Réceptions (`/api/purchases`)
- `GET /api/purchases` : Liste des bons d'achats fournisseurs.
- `GET /api/purchases/:id` : Détail d'un arrivage.
- `POST /api/purchases` : Création et validation d'arrivage (incrémente automatiquement le stock des produits réceptionnés).

---

## 7. Fournisseurs (`/api/suppliers`)
- `GET /api/suppliers` : Liste des éleveurs et grossistes partenaires.
- `POST /api/suppliers` : Enregistrement d'un nouveau fournisseur.

---

## 8. Dépenses & Charges (`/api/expenses`)
- `GET /api/expenses` : Liste des dépenses d'exploitation.
- `POST /api/expenses` : Enregistrement d'une dépense (électricité, transport, etc.).

---

## 9. Pertes & Avaries (`/api/losses`)
- `GET /api/losses` : Historique des pertes déclarées.
- `POST /api/losses` : Déclaration d'une perte (parage, coupure de courant, os non vendables).
- `PUT /api/losses/:id/approve` : Approbation officielle par le contrôleur ou gérant.

---

## 10. Inventaires (`/api/inventory`)
- `GET /api/inventory` : Historique des sessions d'inventaire contradictoire.
- `POST /api/inventory` : Clôture d'inventaire avec comparaison théorique vs physique et ajustement immédiat.

---

## 11. Rapports & Statistiques (`/api/reports`)
- `GET /api/reports/dashboard` : Synthèse exécutive, indicateurs clés et graphiques 7 jours.
- `GET /api/reports/daily` : Rapport journalier complet (CA, marge brute, dépenses, bénéfice net, stock final).

---

## 12. Alertes (`/api/alerts`)
- `GET /api/alerts` : Détection des ruptures de viandes et stocks sous le seuil d'alerte.

---

## 13. Audit & Traçabilité (`/api/audit`)
- `GET /api/audit` : Journal complet et immuable des opérations système.

---

## 14. Utilisateurs (`/api/users`)
- `GET /api/users` : Liste des collaborateurs et rôles.
- `POST /api/users` : Création d'un collaborateur (Admin).
- `PUT /api/users/:id/role` : Modification du rôle RBAC ou désactivation.

---

## 15. Paramètres (`/api/settings`)
- `GET /api/settings` : Consultation des paramètres de la boucherie.
- `PUT /api/settings` : Modification des informations, devises et taux de change.
