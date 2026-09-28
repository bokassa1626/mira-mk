import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Purchase, PurchaseItem } from '../../src/types/index.ts';

export class PurchaseController {
  static async getAll(_req: Request, res: Response) {
    return res.json({ success: true, count: store.purchases.length, data: store.purchases });
  }

  static async getById(req: Request, res: Response) {
    const purchase = store.purchases.find(p => p.id === req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: "Achat non trouvé" });
    return res.json({ success: true, data: purchase });
  }

  /**
   * POST /api/purchases
   * Enregistre un arrivage de marchandise / viande
   */
  static async create(req: Request, res: Response) {
    const { supplierId, items, discount = 0, amountPaid = 0, paymentMethod = 'CASH', notes } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Fournisseur et articles requis pour un achat." });
    }

    const supplier = store.suppliers.find(s => s.id === supplierId);
    if (!supplier) return res.status(404).json({ success: false, message: "Fournisseur introuvable." });

    let subtotal = 0;
    const validatedItems: PurchaseItem[] = [];

    for (const item of items) {
      const product = store.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Produit ${item.productId} introuvable.` });
      }
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const total = qty * unitPrice;
      subtotal += total;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unit: product.unit,
        unitPrice,
        total
      });
    }

    const total = Math.max(0, subtotal - Number(discount));
    const paid = Number(amountPaid);
    const remaining = Math.max(0, total - paid);

    const purchaseNumber = `ACH-${Date.now().toString().slice(-6)}`;
    const requester = req.user || store.users[0];

    const newPurchase: Purchase = {
      id: `ach-${Date.now()}`,
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: validatedItems,
      subtotal,
      discount: Number(discount),
      total,
      amountPaid: paid,
      remainingAmount: remaining,
      paymentMethod,
      status: remaining === 0 ? 'COMPLETED' : 'PARTIAL',
      notes,
      createdBy: requester.uid,
      createdByName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    };

    store.purchases.unshift(newPurchase);

    // Update stock and create stock movements atomically
    for (const it of validatedItems) {
      const prod = store.products.find(p => p.id === it.productId)!;
      const prevStock = prod.currentStock;
      const newStock = prevStock + it.quantity;

      // Update purchase price if higher/recent
      prod.purchasePrice = it.unitPrice;
      prod.currentStock = newStock;
      prod.updatedAt = new Date().toISOString();

      store.stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        productName: prod.name,
        type: 'PURCHASE',
        quantity: it.quantity, // positive
        previousStock: prevStock,
        newStock: newStock,
        referenceId: newPurchase.id,
        referenceNumber: newPurchase.purchaseNumber,
        reason: `Réception arrivage fournisseur ${supplier.name}`,
        userId: requester.uid,
        userName: `${requester.firstName} ${requester.lastName}`,
        createdAt: new Date().toISOString()
      });

      store.recalculateProductStock(prod.id);
    }

    // Update supplier metrics
    supplier.totalPurchases = (supplier.totalPurchases || 0) + total;
    supplier.totalDebt = (supplier.totalDebt || 0) + remaining;
    if (supplier.totalPurchased !== undefined) supplier.totalPurchased += total;
    if (supplier.totalPaid !== undefined) supplier.totalPaid += paid;
    if (supplier.outstandingDebt !== undefined) supplier.outstandingDebt += remaining;
    supplier.updatedAt = new Date().toISOString();

    // Log in audit
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'PURCHASES', newPurchase.id,
      `Validation achat ${newPurchase.purchaseNumber} chez ${supplier.name} pour un total de ${total} CDF`
    );

    return res.status(201).json({
      success: true,
      message: "Arrivage de marchandise enregistré avec succès.",
      data: newPurchase
    });
  }
}
