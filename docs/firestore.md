# Schéma & Relations Firestore — Boucherie Mira-Mk

## 1. Vue d'ensemble des Collections

| Collection | Description | Clé Primaire |
| :--- | :--- | :--- |
| `users` | Comptes employés, rôles RBAC et statuts | `userId` (Firebase Auth UID) |
| `products` | Viandes, morceaux, découpes, prix d'achat/vente, stocks | `productId` |
| `categories` | Familles de viandes (Bœuf, Porc, Chèvre, etc.) | `categoryId` |
| `suppliers` | Fournisseurs d'élevage et grossistes d'abattoir | `supplierId` |
| `purchases` | Bons d'achats et réceptions de viandes | `purchaseId` |
| `sales` | Tickets de caisse et factures de vente au comptoir | `saleId` |
| `stock_movements`| Journal immuable de traçabilité des stocks | `movementId` |
| `expenses` | Dépenses de fonctionnement (frais froid, transport, etc.)| `expenseId` |
| `losses` | Déclarations de pertes, avaries, parage, chaîne du froid | `lossId` |
| `inventory_sessions`| Sessions d'inventaires physiques et écarts | `sessionId` |
| `daily_reports` | Rapports journaliers de clôture financière et stock | `reportId` |
| `audit_logs` | Piste d'audit inviolable des actions système | `auditId` |
| `settings` | Paramètres entreprise, devises, seuils d'alerte | `settings` (Doc singleton) |

---

## 2. Spécification Détaillée des Documents

### `users/{userId}`
```json
{
  "uid": "usr-admin",
  "email": "admin@miramk.cd",
  "firstName": "Bokassa",
  "lastName": "Ntwali",
  "phone": "+243 997 000 001",
  "role": "ADMINISTRATEUR",
  "status": "ACTIVE",
  "createdAt": "2026-09-28T08:00:00.000Z",
  "updatedAt": "2026-09-28T09:30:00.000Z",
  "lastLogin": "2026-09-28T09:30:00.000Z"
}
```

### `products/{productId}`
```json
{
  "id": "prod-1",
  "code": "BOF-001",
  "name": "Filet de Bœuf Supérieur",
  "categoryId": "cat-1",
  "unit": "kg",
  "purchasePrice": 19000,
  "sellingPrice": 25000,
  "initialStock": 80,
  "currentStock": 74,
  "minimumStock": 25,
  "supplierId": "sup-1",
  "status": "AVAILABLE",
  "createdAt": "2026-09-28T08:00:00.000Z",
  "updatedAt": "2026-09-28T09:15:00.000Z"
}
```

### `sales/{saleId}`
```json
{
  "id": "sal-1",
  "saleNumber": "MK-VTE-0001",
  "customerName": "Restaurant Le Safari",
  "items": [
    {
      "productId": "prod-1",
      "productName": "Filet de Bœuf Supérieur",
      "quantity": 6,
      "unit": "kg",
      "unitPrice": 25000,
      "purchasePrice": 19000,
      "total": 150000
    }
  ],
  "subtotal": 150000,
  "discount": 0,
  "total": 150000,
  "totalCost": 114000,
  "grossMargin": 36000,
  "amountPaid": 150000,
  "remainingAmount": 0,
  "paymentMethod": "CASH",
  "status": "COMPLETED",
  "createdBy": "usr-vendeur",
  "createdByName": "Rachel Mwamba",
  "createdAt": "2026-09-28T09:15:00.000Z"
}
```

### `stock_movements/{movementId}` (Immuable)
```json
{
  "id": "mvt-101",
  "productId": "prod-1",
  "productName": "Filet de Bœuf Supérieur",
  "type": "SALE",
  "quantity": -6,
  "previousStock": 80,
  "newStock": 74,
  "referenceId": "sal-1",
  "reason": "Vente comptoir facture MK-VTE-0001",
  "userId": "usr-vendeur",
  "userName": "Rachel Mwamba",
  "createdAt": "2026-09-28T09:15:00.000Z"
}
```

### `audit_logs/{auditId}` (Immuable)
```json
{
  "id": "aud-101",
  "userId": "usr-vendeur",
  "userEmail": "vendeur@miramk.cd",
  "userRole": "VENDEUR",
  "action": "CREATE",
  "module": "SALES",
  "targetId": "sal-1",
  "details": "Vente comptoir validée MK-VTE-0001 : 150000 CDF",
  "createdAt": "2026-09-28T09:15:00.000Z"
}
```
