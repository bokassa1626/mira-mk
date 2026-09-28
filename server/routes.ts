import { Router, Request, Response } from 'express';
import { store } from './db.ts';
import {
  Product, Sale, Purchase, Expense, Loss,
  InventorySession, StockMovement, User, Role
} from '../src/types/index.ts';

export const apiRouter = Router();

// Helper to get authenticated user or default demo admin
function getRequester(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    const found = store.users.find(u => u.uid === userId);
    if (found) return found;
  }
  return store.users[0]; // Default to Bokassa Ntwali (Admin)
}

// ----------------------------------------------------
// AUTH MODULE
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, role, uid } = req.body;
  let user: User | undefined;

  if (uid) {
    user = store.users.find(u => u.uid === uid);
  } else if (email) {
    user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  } else if (role) {
    user = store.users.find(u => u.role === role);
  }

  if (!user) {
    // If not found, fallback to the first user with the requested role or admin
    user = store.users.find(u => u.role === role) || store.users[0];
  }

  user.lastLogin = new Date().toISOString();
  store.logAudit(user.uid, user.email, user.role, 'LOGIN', 'AUTH', user.uid, `Connexion de l'utilisateur ${user.firstName} ${user.lastName} (${user.role})`);

  return res.json({
    success: true,
    message: "Connexion réussie",
    data: user
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const requester = getRequester(req);
  return res.json({ success: true, data: requester });
});

// ----------------------------------------------------
// PRODUCTS & CATEGORIES
// ----------------------------------------------------
apiRouter.get('/categories', (_req: Request, res: Response) => {
  return res.json({ success: true, data: store.categories });
});

apiRouter.get('/products', (req: Request, res: Response) => {
  const { category, search, status } = req.query;
  let list = [...store.products];

  if (category && category !== 'ALL') {
    list = list.filter(p => p.categoryId === category);
  }

  if (status && status !== 'ALL') {
    list = list.filter(p => p.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }

  return res.json({ success: true, count: list.length, data: list });
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });
  return res.json({ success: true, data: product });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Permission refusée. Seuls Administrateurs et Gestionnaires peuvent créer des produits." });
  }

  const { name, code, categoryId, unit, purchasePrice, sellingPrice, initialStock, minimumStock, supplierId } = req.body;
  if (!name || !code || !categoryId || !purchasePrice || !sellingPrice) {
    return res.status(400).json({ success: false, message: "Veuillez renseigner tous les champs obligatoires." });
  }

  const stockVal = Number(initialStock) || 0;
  const minStockVal = Number(minimumStock) || 15;

  let initialStatus: Product['status'] = 'AVAILABLE';
  if (stockVal <= 0) initialStatus = 'OUT_OF_STOCK';
  else if (stockVal <= minStockVal) initialStatus = 'LOW_STOCK';

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    code: code.toUpperCase(),
    name,
    categoryId,
    unit: unit || 'kg',
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
    initialStock: stockVal,
    currentStock: stockVal,
    minimumStock: minStockVal,
    supplierId: supplierId || undefined,
    status: initialStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.products.unshift(newProduct);

  if (stockVal > 0) {
    store.stockMovements.push({
      id: `mvt-${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'ADJUSTMENT',
      quantity: stockVal,
      previousStock: 0,
      newStock: stockVal,
      reason: "Stock initial à la création du produit",
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    });
  }

  store.logAudit(requester.uid, requester.email, requester.role, 'CREATE', 'PRODUCTS', newProduct.id, `Création du produit ${newProduct.name} (${newProduct.code})`);

  return res.status(201).json({ success: true, message: "Produit créé avec succès", data: newProduct });
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Permission refusée." });
  }

  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

  const { name, code, categoryId, unit, purchasePrice, sellingPrice, minimumStock, supplierId, status } = req.body;

  if (name !== undefined) product.name = name;
  if (code !== undefined) product.code = code.toUpperCase();
  if (categoryId !== undefined) product.categoryId = categoryId;
  if (unit !== undefined) product.unit = unit;
  if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
  if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
  if (minimumStock !== undefined) product.minimumStock = Number(minimumStock);
  if (supplierId !== undefined) product.supplierId = supplierId;
  if (status !== undefined) product.status = status;

  // Re-check status against minimumStock
  if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
  else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
  else if (product.status !== 'ARCHIVED') product.status = 'AVAILABLE';

  product.updatedAt = new Date().toISOString();

  store.logAudit(requester.uid, requester.email, requester.role, 'UPDATE', 'PRODUCTS', product.id, `Mise à jour du produit ${product.name}`);

  return res.json({ success: true, message: "Produit mis à jour", data: product });
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role !== 'ADMINISTRATEUR') {
    return res.status(403).json({ success: false, message: "Action réservée à l'administrateur." });
  }

  const product = store.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

  product.status = 'ARCHIVED';
  product.updatedAt = new Date().toISOString();

  store.logAudit(requester.uid, requester.email, requester.role, 'DELETE', 'PRODUCTS', product.id, `Archivage logique du produit ${product.name}`);

  return res.json({ success: true, message: "Produit archivé avec succès" });
});

// ----------------------------------------------------
// STOCK MANAGEMENT
// ----------------------------------------------------
apiRouter.get('/stock', (_req: Request, res: Response) => {
  let totalValuation = 0;
  let totalWeightKg = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of store.products) {
    if (p.status !== 'ARCHIVED') {
      totalValuation += p.currentStock * p.purchasePrice;
      if (p.unit === 'kg') totalWeightKg += p.currentStock;
      if (p.currentStock <= 0) outOfStockCount++;
      else if (p.currentStock <= p.minimumStock) lowStockCount++;
    }
  }

  return res.json({
    success: true,
    data: {
      products: store.products.filter(p => p.status !== 'ARCHIVED'),
      summary: {
        totalProducts: store.products.filter(p => p.status !== 'ARCHIVED').length,
        totalValuation,
        totalWeightKg: Math.round(totalWeightKg * 100) / 100,
        lowStockCount,
        outOfStockCount
      }
    }
  });
});

apiRouter.get('/stock/movements', (req: Request, res: Response) => {
  const { productId, type } = req.query;
  let list = [...store.stockMovements];

  if (productId) list = list.filter(m => m.productId === productId);
  if (type && type !== 'ALL') list = list.filter(m => m.type === type);

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, count: list.length, data: list });
});

apiRouter.post('/stock/adjust', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Non autorisé à faire un ajustement de stock." });
  }

  const { productId, newStock, reason } = req.body;
  if (!productId || newStock === undefined || !reason) {
    return res.status(400).json({ success: false, message: "Produit, nouveau stock et motif obligatoires." });
  }

  const product = store.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

  const targetStock = Number(newStock);
  const previousStock = product.currentStock;
  const difference = targetStock - previousStock;

  product.currentStock = targetStock;
  if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
  else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
  else product.status = 'AVAILABLE';
  product.updatedAt = new Date().toISOString();

  const movement: StockMovement = {
    id: `mvt-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    type: 'ADJUSTMENT',
    quantity: difference,
    previousStock,
    newStock: targetStock,
    reason: `Ajustement manuel: ${reason}`,
    userId: requester.uid,
    userName: `${requester.firstName} ${requester.lastName}`,
    createdAt: new Date().toISOString()
  };

  store.stockMovements.unshift(movement);
  store.logAudit(requester.uid, requester.email, requester.role, 'STOCK_ADJUSTMENT', 'STOCK', product.id, `Ajustement de stock pour ${product.name}: ${previousStock} -> ${targetStock} (${reason})`);

  return res.json({ success: true, message: "Stock ajusté avec succès", data: product });
});

// ----------------------------------------------------
// PURCHASES & SUPPLIERS
// ----------------------------------------------------
apiRouter.get('/suppliers', (_req: Request, res: Response) => {
  return res.json({ success: true, data: store.suppliers });
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  const requester = getRequester(req);
  const { name, phone, email, address, contactPerson } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: "Nom et téléphone obligatoires." });

  const newSupplier = {
    id: `sup-${Date.now()}`,
    name,
    phone,
    email: email || "",
    address: address || "Lubumbashi",
    contactPerson: contactPerson || "",
    status: 'ACTIVE' as const,
    totalPurchases: 0,
    totalDebt: 0,
    createdAt: new Date().toISOString()
  };

  store.suppliers.unshift(newSupplier);
  store.logAudit(requester.uid, requester.email, requester.role, 'CREATE', 'SUPPLIERS', newSupplier.id, `Création fournisseur ${name}`);
  return res.status(201).json({ success: true, data: newSupplier });
});

apiRouter.get('/purchases', (_req: Request, res: Response) => {
  const list = [...store.purchases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, count: list.length, data: list });
});

apiRouter.get('/purchases/:id', (req: Request, res: Response) => {
  const p = store.purchases.find(item => item.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, message: "Achat non trouvé" });
  return res.json({ success: true, data: p });
});

apiRouter.post('/purchases', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Seul un Gestionnaire ou Administrateur peut valider un achat." });
  }

  const { supplierId, items, paymentMethod, amountPaid, discount = 0, currency = "CDF" } = req.body;
  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Fournisseur et articles requis." });
  }

  const supplier = store.suppliers.find(s => s.id === supplierId);
  const supplierName = supplier ? supplier.name : "Fournisseur Inconnu";

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = store.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `Produit introuvable ID: ${item.productId}` });
    }
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || product.purchasePrice;
    const lineTotal = qty * price;
    subtotal += lineTotal;

    processedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: price,
      total: lineTotal
    });
  }

  const total = Math.max(0, subtotal - Number(discount));
  const paid = Number(amountPaid) || total;
  const remaining = Math.max(0, total - paid);

  const purchaseNumber = `ACH-${new Date().getFullYear()}-${String(store.purchases.length + 1).padStart(4, '0')}`;

  const newPurchase: Purchase = {
    id: `ach-${Date.now()}`,
    purchaseNumber,
    supplierId,
    supplierName,
    items: processedItems,
    currency,
    subtotal,
    discount: Number(discount),
    total,
    amountPaid: paid,
    remainingAmount: remaining,
    paymentMethod: paymentMethod || 'CASH',
    status: 'VALIDATED',
    createdBy: requester.uid,
    createdByName: `${requester.firstName} ${requester.lastName}`,
    createdAt: new Date().toISOString()
  };

  // Transaction: apply stock increase & movement for every item
  for (const item of processedItems) {
    const product = store.products.find(p => p.id === item.productId)!;
    const prevStock = product.currentStock;
    product.currentStock += item.quantity;
    product.purchasePrice = item.unitPrice; // update latest purchase price

    if (product.currentStock > product.minimumStock) product.status = 'AVAILABLE';
    else if (product.currentStock > 0) product.status = 'LOW_STOCK';
    product.updatedAt = new Date().toISOString();

    store.stockMovements.unshift({
      id: `mvt-${Date.now()}-${item.productId}`,
      productId: product.id,
      productName: product.name,
      type: 'PURCHASE',
      quantity: item.quantity,
      previousStock: prevStock,
      newStock: product.currentStock,
      referenceId: newPurchase.id,
      reason: `Approvisionnement ${purchaseNumber} (${supplierName})`,
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: newPurchase.createdAt
    });
  }

  // Update supplier totals & debt
  if (supplier) {
    supplier.totalPurchases += total;
    supplier.totalDebt += remaining;
  }

  store.purchases.unshift(newPurchase);
  store.logAudit(requester.uid, requester.email, requester.role, 'PURCHASE', 'PURCHASES', newPurchase.id, `Validation Achat ${purchaseNumber} montant: ${total} ${currency}`);

  return res.status(201).json({ success: true, message: "Achat validé et stock mis à jour", data: newPurchase });
});

// ----------------------------------------------------
// SALES & INVOICES (POS)
// ----------------------------------------------------
apiRouter.get('/sales', (_req: Request, res: Response) => {
  const list = [...store.sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, count: list.length, data: list });
});

apiRouter.get('/sales/:id', (req: Request, res: Response) => {
  const sale = store.sales.find(s => s.id === req.params.id);
  if (!sale) return res.status(404).json({ success: false, message: "Vente non trouvée" });
  return res.json({ success: true, data: sale });
});

apiRouter.post('/sales', (req: Request, res: Response) => {
  const requester = getRequester(req);
  const { customerName, items, paymentMethod, amountPaid, discount = 0, currency = "CDF" } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Le panier de vente est vide." });
  }

  // 1. Critical Rule: Verify stock availability for ALL products BEFORE processing
  for (const item of items) {
    const product = store.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `Produit introuvable ID: ${item.productId}` });
    }
    const requestedQty = Number(item.quantity) || 0;
    if (requestedQty <= 0) {
      return res.status(400).json({ success: false, message: `Quantité invalide pour ${product.name}` });
    }
    if (product.currentStock < requestedQty) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant pour "${product.name}". Disponible: ${product.currentStock} ${product.unit}, Demandé: ${requestedQty} ${product.unit}. Vente refusée.`
      });
    }
  }

  // 2. Compute totals, COGS (Cost of goods sold), and gross margin
  let subtotal = 0;
  let totalCost = 0;
  const processedItems = [];

  for (const item of items) {
    const product = store.products.find(p => p.id === item.productId)!;
    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPrice) || product.sellingPrice;
    const lineTotal = qty * unitPrice;
    const lineCost = qty * product.purchasePrice;

    subtotal += lineTotal;
    totalCost += lineCost;

    processedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice,
      purchasePrice: product.purchasePrice,
      total: lineTotal
    });
  }

  const disc = Number(discount) || 0;
  const total = Math.max(0, subtotal - disc);
  const grossMargin = total - totalCost;
  const paid = Number(amountPaid) || total;
  const remaining = Math.max(0, total - paid);

  const saleNumber = `${store.settings.invoicePrefix || 'MK-'}${new Date().getFullYear()}-${String(store.sales.length + 1).padStart(4, '0')}`;

  const newSale: Sale = {
    id: `vnt-${Date.now()}`,
    saleNumber,
    customerName: customerName || "Client Comptoir",
    items: processedItems,
    currency,
    subtotal,
    discount: disc,
    total,
    totalCost,
    grossMargin,
    amountPaid: paid,
    remainingAmount: remaining,
    paymentMethod: paymentMethod || 'CASH',
    status: 'COMPLETED',
    createdBy: requester.uid,
    createdByName: `${requester.firstName} ${requester.lastName}`,
    createdAt: new Date().toISOString()
  };

  // 3. Atomically decrease stock and create stock movements
  for (const item of processedItems) {
    const product = store.products.find(p => p.id === item.productId)!;
    const prevStock = product.currentStock;
    product.currentStock -= item.quantity;

    if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
    else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
    else product.status = 'AVAILABLE';
    product.updatedAt = new Date().toISOString();

    store.stockMovements.unshift({
      id: `mvt-${Date.now()}-${item.productId}`,
      productId: product.id,
      productName: product.name,
      type: 'SALE',
      quantity: -item.quantity,
      previousStock: prevStock,
      newStock: product.currentStock,
      referenceId: newSale.id,
      reason: `Vente ${saleNumber}`,
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: newSale.createdAt
    });
  }

  store.sales.unshift(newSale);
  store.logAudit(requester.uid, requester.email, requester.role, 'SALE', 'SALES', newSale.id, `Vente validée ${saleNumber}, Total: ${total} ${currency}, Marge: ${grossMargin} ${currency}`);

  return res.status(201).json({
    success: true,
    message: "Vente validée avec succès",
    data: newSale
  });
});

apiRouter.post('/sales/:id/cancel', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role !== 'ADMINISTRATEUR') {
    return res.status(403).json({ success: false, message: "Seul un Administrateur peut annuler une vente." });
  }

  const sale = store.sales.find(s => s.id === req.params.id);
  if (!sale) return res.status(404).json({ success: false, message: "Vente non trouvée" });
  if (sale.status === 'CANCELLED') {
    return res.status(400).json({ success: false, message: "Cette vente est déjà annulée." });
  }

  sale.status = 'CANCELLED';

  // Restore stocks
  for (const item of sale.items) {
    const product = store.products.find(p => p.id === item.productId);
    if (product) {
      const prev = product.currentStock;
      product.currentStock += item.quantity;
      if (product.currentStock > product.minimumStock) product.status = 'AVAILABLE';
      else if (product.currentStock > 0) product.status = 'LOW_STOCK';
      product.updatedAt = new Date().toISOString();

      store.stockMovements.unshift({
        id: `mvt-${Date.now()}-${item.productId}`,
        productId: product.id,
        productName: product.name,
        type: 'RETURN',
        quantity: item.quantity,
        previousStock: prev,
        newStock: product.currentStock,
        referenceId: sale.id,
        reason: `Annulation de la vente ${sale.saleNumber}`,
        userId: requester.uid,
        userName: `${requester.firstName} ${requester.lastName}`,
        createdAt: new Date().toISOString()
      });
    }
  }

  store.logAudit(requester.uid, requester.email, requester.role, 'CANCEL', 'SALES', sale.id, `Annulation de la vente ${sale.saleNumber}`);
  return res.json({ success: true, message: "Vente annulée et stock réintégré", data: sale });
});

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------
apiRouter.get('/expenses', (_req: Request, res: Response) => {
  const list = [...store.expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, count: list.length, data: list });
});

apiRouter.post('/expenses', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Non autorisé à enregistrer des charges d'exploitation." });
  }

  const { category, description, amount, paymentMethod, reference, currency = "CDF" } = req.body;
  if (!category || !description || !amount) {
    return res.status(400).json({ success: false, message: "Catégorie, motif et montant obligatoires." });
  }

  const newExpense: Expense = {
    id: `dep-${Date.now()}`,
    category,
    description,
    amount: Number(amount),
    currency,
    paymentMethod: paymentMethod || 'CASH',
    reference: reference || '',
    createdBy: requester.uid,
    createdByName: `${requester.firstName} ${requester.lastName}`,
    createdAt: new Date().toISOString()
  };

  store.expenses.unshift(newExpense);
  store.logAudit(requester.uid, requester.email, requester.role, 'EXPENSE', 'EXPENSES', newExpense.id, `Dépense [${category}]: ${amount} ${currency} (${description})`);

  return res.status(201).json({ success: true, message: "Dépense enregistrée", data: newExpense });
});

// ----------------------------------------------------
// LOSSES & ANOMALIES
// ----------------------------------------------------
apiRouter.get('/losses', (_req: Request, res: Response) => {
  const list = [...store.losses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, count: list.length, data: list });
});

apiRouter.post('/losses', (req: Request, res: Response) => {
  const requester = getRequester(req);
  const { productId, quantity, type, reason } = req.body;

  if (!productId || !quantity || !type || !reason) {
    return res.status(400).json({ success: false, message: "Produit, quantité, type de perte et motif obligatoires." });
  }

  const product = store.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

  const qty = Number(quantity);
  const unitPrice = product.purchasePrice;
  const totalVal = qty * unitPrice;

  // If created by Admin or Gestionnaire, it is auto-approved; otherwise PENDING for controller/vendeur
  const isAutoApproved = requester.role === 'ADMINISTRATEUR' || requester.role === 'GESTIONNAIRE';

  const newLoss: Loss = {
    id: `loss-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    quantity: qty,
    unitPrice,
    totalValue: totalVal,
    type,
    reason,
    status: isAutoApproved ? 'APPROVED' : 'PENDING',
    declaredBy: requester.uid,
    declaredByName: `${requester.firstName} ${requester.lastName}`,
    approvedBy: isAutoApproved ? requester.uid : undefined,
    approvedByName: isAutoApproved ? `${requester.firstName} ${requester.lastName}` : undefined,
    createdAt: new Date().toISOString(),
    approvedAt: isAutoApproved ? new Date().toISOString() : undefined
  };

  if (isAutoApproved) {
    const prev = product.currentStock;
    product.currentStock = Math.max(0, product.currentStock - qty);
    if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
    else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
    product.updatedAt = new Date().toISOString();

    store.stockMovements.unshift({
      id: `mvt-${Date.now()}-${product.id}`,
      productId: product.id,
      productName: product.name,
      type: 'LOSS',
      quantity: -qty,
      previousStock: prev,
      newStock: product.currentStock,
      referenceId: newLoss.id,
      reason: `Perte constatée (${type}): ${reason}`,
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: newLoss.createdAt
    });
  }

  store.losses.unshift(newLoss);
  store.logAudit(requester.uid, requester.email, requester.role, 'CREATE', 'LOSSES', newLoss.id, `Déclaration de perte pour ${product.name} (-${qty} ${product.unit}, Valeur: ${totalVal} CDF)`);

  return res.status(201).json({ success: true, message: isAutoApproved ? "Perte validée et stock diminué" : "Perte enregistrée en attente d'approbation", data: newLoss });
});

apiRouter.put('/losses/:id/approve', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Permission refusée." });
  }

  const loss = store.losses.find(l => l.id === req.params.id);
  if (!loss) return res.status(404).json({ success: false, message: "Perte non trouvée" });
  if (loss.status === 'APPROVED') return res.status(400).json({ success: false, message: "Déjà approuvée." });

  loss.status = 'APPROVED';
  loss.approvedBy = requester.uid;
  loss.approvedByName = `${requester.firstName} ${requester.lastName}`;
  loss.approvedAt = new Date().toISOString();

  const product = store.products.find(p => p.id === loss.productId);
  if (product) {
    const prev = product.currentStock;
    product.currentStock = Math.max(0, product.currentStock - loss.quantity);
    if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
    else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
    product.updatedAt = new Date().toISOString();

    store.stockMovements.unshift({
      id: `mvt-${Date.now()}-${product.id}`,
      productId: product.id,
      productName: product.name,
      type: 'LOSS',
      quantity: -loss.quantity,
      previousStock: prev,
      newStock: product.currentStock,
      referenceId: loss.id,
      reason: `Validation Perte (${loss.type}): ${loss.reason}`,
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    });
  }

  store.logAudit(requester.uid, requester.email, requester.role, 'VALIDATE', 'LOSSES', loss.id, `Approbation perte ${loss.productName} (-${loss.quantity})`);
  return res.json({ success: true, message: "Perte approuvée et stock ajusté", data: loss });
});

// ----------------------------------------------------
// INVENTORY SESSIONS
// ----------------------------------------------------
apiRouter.get('/inventory', (_req: Request, res: Response) => {
  const list = [...store.inventorySessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, data: list });
});

apiRouter.post('/inventory', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role === 'VENDEUR') {
    return res.status(403).json({ success: false, message: "Non autorisé à soumettre un inventaire." });
  }

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Les données de comptage physique sont requises." });
  }

  let totalDiffVal = 0;
  const processedItems = [];

  for (const it of items) {
    const product = store.products.find(p => p.id === it.productId);
    if (product) {
      const theo = product.currentStock;
      const phys = Number(it.physicalStock) >= 0 ? Number(it.physicalStock) : theo;
      const diff = phys - theo;
      const diffVal = diff * product.purchasePrice;
      totalDiffVal += diffVal;

      processedItems.push({
        productId: product.id,
        productName: product.name,
        theoreticalStock: theo,
        physicalStock: phys,
        difference: diff,
        unitPurchasePrice: product.purchasePrice,
        differenceValue: diffVal,
        reason: it.reason || (diff !== 0 ? "Écart d'inventaire physique" : "Conforme")
      });

      // Update product current stock to match physical reality
      if (diff !== 0) {
        product.currentStock = phys;
        if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
        else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
        else product.status = 'AVAILABLE';
        product.updatedAt = new Date().toISOString();

        store.stockMovements.unshift({
          id: `mvt-${Date.now()}-${product.id}`,
          productId: product.id,
          productName: product.name,
          type: 'INVENTORY',
          quantity: diff,
          previousStock: theo,
          newStock: phys,
          reason: `Régularisation inventaire: ${diff > 0 ? '+' : ''}${diff} ${product.unit}`,
          userId: requester.uid,
          userName: `${requester.firstName} ${requester.lastName}`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  const sessionNumber = `INV-${new Date().getFullYear()}-${String(store.inventorySessions.length + 1).padStart(2, '0')}`;

  const session: InventorySession = {
    id: `inv-${Date.now()}`,
    sessionNumber,
    status: 'VALIDATED',
    items: processedItems,
    totalDifferenceValue: totalDiffVal,
    conductedBy: requester.uid,
    conductedByName: `${requester.firstName} ${requester.lastName}`,
    validatedBy: requester.uid,
    validatedByName: `${requester.firstName} ${requester.lastName}`,
    createdAt: new Date().toISOString(),
    validatedAt: new Date().toISOString()
  };

  store.inventorySessions.unshift(session);
  store.logAudit(requester.uid, requester.email, requester.role, 'VALIDATE', 'INVENTORY', session.id, `Clôture inventaire ${sessionNumber}, Écart total: ${totalDiffVal} CDF`);

  return res.status(201).json({ success: true, message: "Inventaire validé et stocks mis à jour", data: session });
});

// ----------------------------------------------------
// REPORTS & DASHBOARD METRICS
// ----------------------------------------------------
apiRouter.get('/reports/dashboard', (_req: Request, res: Response) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Completed sales
  const validSales = store.sales.filter(s => s.status === 'COMPLETED');
  const todaySales = validSales.filter(s => s.createdAt.slice(0, 10) === todayStr);

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayCost = todaySales.reduce((acc, s) => acc + s.totalCost, 0);
  const todayGrossMargin = todayRevenue - todayCost;

  // Purchases today
  const todayPurchases = store.purchases
    .filter(p => p.status === 'VALIDATED' && p.createdAt.slice(0, 10) === todayStr)
    .reduce((acc, p) => acc + p.total, 0);

  // Expenses today
  const todayExpenses = store.expenses
    .filter(e => e.createdAt.slice(0, 10) === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  // Losses today
  const todayLosses = store.losses
    .filter(l => l.status === 'APPROVED' && l.createdAt.slice(0, 10) === todayStr)
    .reduce((acc, l) => acc + l.totalValue, 0);

  // Net Profit Estimated
  const todayNetProfit = todayGrossMargin - todayExpenses - todayLosses;

  // Total stock valuation
  let totalStockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of store.products) {
    if (p.status !== 'ARCHIVED') {
      totalStockValue += p.currentStock * p.purchasePrice;
      if (p.currentStock <= 0) outOfStockCount++;
      else if (p.currentStock <= p.minimumStock) lowStockCount++;
    }
  }

  // Sales by meat category
  const salesByCategoryMap: Record<string, number> = {};
  for (const sale of validSales) {
    for (const item of sale.items) {
      const prod = store.products.find(p => p.id === item.productId);
      const catName = prod ? (store.categories.find(c => c.id === prod.categoryId)?.name || 'Autres') : 'Autres';
      salesByCategoryMap[catName] = (salesByCategoryMap[catName] || 0) + item.total;
    }
  }

  const categorySalesData = Object.entries(salesByCategoryMap).map(([name, value]) => ({ name, value }));

  // Last 7 days sales & margin trend
  const last7Days: { date: string; sales: number; profit: number; expenses: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dayKey = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

    const daySalesTotal = validSales
      .filter(s => s.createdAt.slice(0, 10) === dayKey)
      .reduce((acc, s) => acc + s.total, 0);

    const dayCostTotal = validSales
      .filter(s => s.createdAt.slice(0, 10) === dayKey)
      .reduce((acc, s) => acc + s.totalCost, 0);

    const dayExpTotal = store.expenses
      .filter(e => e.createdAt.slice(0, 10) === dayKey)
      .reduce((acc, e) => acc + e.amount, 0);

    last7Days.push({
      date: dayLabel,
      sales: daySalesTotal,
      profit: Math.max(0, daySalesTotal - dayCostTotal - dayExpTotal),
      expenses: dayExpTotal
    });
  }

  return res.json({
    success: true,
    data: {
      metrics: {
        todayRevenue,
        todayPurchases,
        todayExpenses,
        todayGrossMargin,
        todayNetProfit,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        totalProducts: store.products.filter(p => p.status !== 'ARCHIVED').length,
        totalSalesCount: todaySales.length
      },
      charts: {
        last7Days,
        categorySalesData
      },
      recentSales: store.sales.slice(0, 5),
      recentMovements: store.stockMovements.slice(0, 6)
    }
  });
});

apiRouter.get('/reports/daily', (req: Request, res: Response) => {
  const dateQuery = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  const sales = store.sales.filter(s => s.status === 'COMPLETED' && s.createdAt.slice(0, 10) === dateQuery);
  const purchases = store.purchases.filter(p => p.status === 'VALIDATED' && p.createdAt.slice(0, 10) === dateQuery);
  const expenses = store.expenses.filter(e => e.createdAt.slice(0, 10) === dateQuery);
  const losses = store.losses.filter(l => l.status === 'APPROVED' && l.createdAt.slice(0, 10) === dateQuery);
  const movements = store.stockMovements.filter(m => m.createdAt.slice(0, 10) === dateQuery);

  const totalSales = sales.reduce((a, b) => a + b.total, 0);
  const totalCost = sales.reduce((a, b) => a + b.totalCost, 0);
  const grossMargin = totalSales - totalCost;
  const totalPurchases = purchases.reduce((a, b) => a + b.total, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const totalLosses = losses.reduce((a, b) => a + b.totalValue, 0);
  const netProfit = grossMargin - totalExpenses - totalLosses;

  return res.json({
    success: true,
    data: {
      date: dateQuery,
      summary: {
        totalSales,
        totalCost,
        grossMargin,
        totalPurchases,
        totalExpenses,
        totalLosses,
        netProfit
      },
      sales,
      purchases,
      expenses,
      losses,
      movements
    }
  });
});

// ----------------------------------------------------
// ALERTS
// ----------------------------------------------------
apiRouter.get('/alerts', (_req: Request, res: Response) => {
  const lowStock = store.products.filter(p => p.status !== 'ARCHIVED' && p.currentStock > 0 && p.currentStock <= p.minimumStock);
  const outOfStock = store.products.filter(p => p.status !== 'ARCHIVED' && p.currentStock <= 0);
  const pendingLosses = store.losses.filter(l => l.status === 'PENDING');

  return res.json({
    success: true,
    data: {
      lowStock,
      outOfStock,
      pendingLosses,
      totalAlerts: lowStock.length + outOfStock.length + pendingLosses.length
    }
  });
});

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
apiRouter.get('/audit', (_req: Request, res: Response) => {
  return res.json({ success: true, count: store.auditLogs.length, data: store.auditLogs });
});

// ----------------------------------------------------
// USERS & ROLES
// ----------------------------------------------------
apiRouter.get('/users', (_req: Request, res: Response) => {
  return res.json({ success: true, data: store.users });
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role !== 'ADMINISTRATEUR') {
    return res.status(403).json({ success: false, message: "Seul un Administrateur peut créer des utilisateurs." });
  }

  const { email, firstName, lastName, phone, role } = req.body;
  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ success: false, message: "Email, nom, prénom et rôle obligatoires." });
  }

  const newUser: User = {
    uid: `usr-${Date.now()}`,
    email,
    firstName,
    lastName,
    phone: phone || "",
    role: role as Role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  store.users.push(newUser);
  store.logAudit(requester.uid, requester.email, requester.role, 'CREATE', 'USERS', newUser.uid, `Création utilisateur ${firstName} ${lastName} (${role})`);

  return res.status(201).json({ success: true, message: "Utilisateur créé", data: newUser });
});

apiRouter.put('/users/:id/role', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role !== 'ADMINISTRATEUR') {
    return res.status(403).json({ success: false, message: "Action réservée à l'administrateur." });
  }

  const user = store.users.find(u => u.uid === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

  const { role, status } = req.body;
  if (role) user.role = role as Role;
  if (status) user.status = status;

  store.logAudit(requester.uid, requester.email, requester.role, 'UPDATE', 'USERS', user.uid, `Modification de l'utilisateur ${user.firstName} ${user.lastName}`);
  return res.json({ success: true, message: "Utilisateur mis à jour", data: user });
});

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------
apiRouter.get('/settings', (_req: Request, res: Response) => {
  return res.json({ success: true, data: store.settings });
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const requester = getRequester(req);
  if (requester.role !== 'ADMINISTRATEUR') {
    return res.status(403).json({ success: false, message: "Seul un Administrateur peut modifier les paramètres généraux." });
  }

  store.settings = { ...store.settings, ...req.body };
  store.logAudit(requester.uid, requester.email, requester.role, 'UPDATE', 'SETTINGS', 'settings', "Mise à jour des paramètres de la Boucherie Mira-Mk");
  return res.json({ success: true, message: "Paramètres enregistrés", data: store.settings });
});
