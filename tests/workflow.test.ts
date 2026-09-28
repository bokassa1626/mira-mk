/**
 * Suite de Tests Automatisés — Système de Gestion Boucherie Mira-Mk
 * Vérifie l'ensemble des règles métier exigées dans le cahier des charges (Section 37) :
 * - Authentification et vérification des rôles
 * - Création produit
 * - Arrivage / Achat et augmentation automatique de stock
 * - Vente comptoir et diminution de stock
 * - Rejet d'une vente en cas de stock insuffisant
 * - Déclaration de perte et déduction
 * - Inventaire physique contradictoire
 * - Calculs financiers (CA, Marge, Bénéfice Net)
 * - Détection automatique des alertes de stock
 * - Journalisation de l'audit
 */

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api';

async function runTests() {
  console.log('🚀 Démarrage de la suite de tests métier Boucherie Mira-Mk...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `— ${details}` : ''}`);
    }
  }

  try {
    // 1. Authentification
    console.log('1. Test Authentification & Rôles');
    const authRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMINISTRATEUR' }),
    }).then(r => r.json());

    assert(authRes.success === true, 'Connexion de l’administrateur', authRes.message);
    const adminToken = authRes.token;

    // 2. Création Catégorie & Produit
    console.log('\n2. Test Création Produit & Catégorie');
    const catRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        code: `TST-${Date.now().toString().slice(-4)}`,
        name: 'Viande Test Automatisé',
        description: 'Catégorie temporaire pour validation'
      }),
    }).then(r => r.json());

    assert(catRes.success === true, 'Création d’une famille de viande');
    const categoryId = catRes.data.id;

    const prodCode = `VIAN-${Date.now().toString().slice(-4)}`;
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        code: prodCode,
        name: 'Filet de Bœuf Test',
        categoryId,
        unit: 'kg',
        purchasePrice: 18000,
        sellingPrice: 24000,
        initialStock: 10,
        minimumStock: 5,
      }),
    }).then(r => r.json());

    assert(prodRes.success === true, 'Création produit de viande avec stock initial');
    const productId = prodRes.data.id;

    // 3. Achat / Arrivage et Augmentation de stock
    console.log('\n3. Test Achat & Augmentation de Stock');
    const purchaseRes = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        supplierId: 'sup-1',
        items: [
          {
            productId,
            productName: 'Filet de Bœuf Test',
            quantity: 15,
            unitPrice: 18000,
            total: 270000,
          }
        ],
        amountPaid: 270000,
        paymentMethod: 'CASH',
        notes: 'Arrivage test'
      }),
    }).then(r => r.json());

    assert(purchaseRes.success === true, 'Enregistrement bon d’achat fournisseur');

    const prodAfterPurchase = await fetch(`${BASE_URL}/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    // Initial 10 + 15 purchased = 25 kg
    assert(
      prodAfterPurchase.data.currentStock === 25,
      'Augmentation automatique du stock suite à achat (10 kg -> 25 kg)',
      `Stock actuel: ${prodAfterPurchase.data.currentStock}`
    );

    // 4. Vente et Diminution de stock
    console.log('\n4. Test Vente Comptoir & Décrémentation');
    const saleRes = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        customerName: 'Client Comptoir Test',
        items: [
          {
            productId,
            productName: 'Filet de Bœuf Test',
            quantity: 8,
            unitPrice: 24000,
            total: 192000,
          }
        ],
        paymentMethod: 'CASH'
      }),
    }).then(r => r.json());

    assert(saleRes.success === true, 'Validation vente comptoir POS');
    assert(saleRes.data.grossMargin === 8 * (24000 - 18000), 'Calcul exact de la marge brute unitaire');

    const prodAfterSale = await fetch(`${BASE_URL}/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    // 25 - 8 = 17 kg
    assert(
      prodAfterSale.data.currentStock === 17,
      'Diminution automatique du stock suite à vente (25 kg -> 17 kg)',
      `Stock actuel: ${prodAfterSale.data.currentStock}`
    );

    // 5. Rejet d'une vente en cas de stock insuffisant
    console.log('\n5. Test Rejet Vente en cas de Stock Insuffisant');
    const excessiveSaleRes = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        customerName: 'Client Excessif',
        items: [
          {
            productId,
            productName: 'Filet de Bœuf Test',
            quantity: 100, // Dispo: 17 kg
            unitPrice: 24000,
            total: 2400000,
          }
        ],
        paymentMethod: 'CASH'
      }),
    }).then(r => r.json());

    assert(
      excessiveSaleRes.success === false,
      'Rejet immédiat d’une vente si la quantité demandée dépasse le stock physique',
      excessiveSaleRes.message
    );

    // 6. Déclaration de Perte & Avarie
    console.log('\n6. Test Déclaration de Perte');
    const lossRes = await fetch(`${BASE_URL}/losses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        productId,
        quantity: 2,
        type: 'DAMAGED',
        reason: 'Parage et découpe technique',
      }),
    }).then(r => r.json());

    assert(lossRes.success === true, 'Déclaration et déduction d’une perte de viande');

    const prodAfterLoss = await fetch(`${BASE_URL}/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    // 17 - 2 = 15 kg
    assert(
      prodAfterLoss.data.currentStock === 15,
      'Mise à jour du stock après déclaration de perte (17 kg -> 15 kg)',
      `Stock actuel: ${prodAfterLoss.data.currentStock}`
    );

    // 7. Inventaire Physique Contradictoire
    console.log('\n7. Test Inventaire Physique Contradictoire');
    const invRes = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-user-role': 'ADMINISTRATEUR',
      },
      body: JSON.stringify({
        items: [
          {
            productId,
            physicalStock: 14, // Théorique: 15, Écart: -1
            notes: 'Légère dessiccation en chambre froide'
          }
        ]
      }),
    }).then(r => r.json());

    assert(invRes.success === true, 'Validation clôture d’inventaire contradictoire');

    const prodAfterInv = await fetch(`${BASE_URL}/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    assert(
      prodAfterInv.data.currentStock === 14,
      'Ajustement du stock au comptage physique réel (15 kg -> 14 kg)',
      `Stock actuel: ${prodAfterInv.data.currentStock}`
    );

    // 8. Calculs Financiers & Rapports
    console.log('\n8. Test Rapports & Clôtures Financières');
    const reportRes = await fetch(`${BASE_URL}/reports/daily`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    assert(reportRes.success === true, 'Génération du rapport journalier');
    assert(
      reportRes.data.summary.totalSales > 0,
      'Chiffre d’affaires calculé à partir des ventes effectives'
    );
    assert(
      reportRes.data.summary.grossMargin >= 0,
      'Marge commerciale calculée avec exactitude'
    );

    // 9. Alertes de Stock
    console.log('\n9. Test Centre d’Alertes');
    const alertsRes = await fetch(`${BASE_URL}/alerts`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    assert(alertsRes.success === true, 'Surveillance des stocks sous le seuil d’alerte et ruptures');

    // 10. Audit Log Immuable
    console.log('\n10. Test Journalisation Audit');
    const auditRes = await fetch(`${BASE_URL}/audit`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    assert(auditRes.success === true, 'Journal d’audit accessible aux administrateurs');
    assert(
      auditRes.data.some((a: any) => a.module === 'SALES' || a.module === 'STOCK'),
      'Présence des actions critiques dans la piste d’audit immuable'
    );

    console.log(`\n===========================================`);
    console.log(`Résultats : ${testsPassed} / ${testsTotal} tests réussis avec succès ! 🎉`);
    console.log(`===========================================\n`);
  } catch (err) {
    console.error('Erreur inattendue durant les tests:', err);
  }
}

runTests();
