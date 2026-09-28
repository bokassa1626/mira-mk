import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Sale, SaleItem } from '../../src/types/index.ts';

export class SaleController {
  static async getAll(req: Request, res: Response) {
    const { startDate, endDate, status } = req.query;
    let list = [...store.sales];

    if (status && status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }
    if (startDate && typeof startDate === 'string') {
      list = list.filter(s => s.createdAt >= startDate);
    }
    if (endDate && typeof endDate === 'string') {
      list = list.filter(s => s.createdAt <= endDate);
    }

    return res.json({ success: true, count: list.length, data: list });
  }

  static async getById(req: Request, res: Response) {
    const sale = store.sales.find(s => s.id === req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Vente non trouvée" });
    return res.json({ success: true, data: sale });
  }

  /**
   * POST /api/sales
   * Valide une vente avec vérification stricte de stock
   */
  static async create(req: Request, res: Response) {
    const {
      items, customerName, customerPhone, discount = 0,
      amountPaid, paymentMethod = 'CASH', notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Le panier de vente ne peut pas être vide." });
    }

    // 1. Check stock availability for all items first
    for (const item of items) {
      const product = store.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Produit ID ${item.productId} non trouvé.` });
      }
      const reqQty = Number(item.quantity);
      if (reqQty <= 0) {
        return res.status(400).json({ success: false, message: `Quantité invalide pour ${product.name}.` });
      }
      if (product.currentStock < reqQty) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name} (Stock disponible : ${product.currentStock} ${product.unit}, demandé : ${reqQty} ${product.unit}).`
        });
      }
    }

    // 2. Build line items, compute costs and margins
    let subtotal = 0;
    let totalCost = 0;
    const validatedItems: SaleItem[] = [];

    for (const item of items) {
      const product = store.products.find(p => p.id === item.productId)!;
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice || product.sellingPrice);
      const purchasePrice = product.purchasePrice;
      const lineTotal = qty * unitPrice;
      const lineCost = qty * purchasePrice;

      subtotal += lineTotal;
      totalCost += lineCost;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unit: product.unit,
        unitPrice,
        purchasePrice,
        total: lineTotal
      });
    }

    const discountVal = Number(discount) || 0;
    const total = Math.max(0, subtotal - discountVal);
    const paid = amountPaid !== undefined ? Number(amountPaid) : total;
    const remaining = Math.max(0, total - paid);
    const grossMargin = total - totalCost;

    const saleNumber = `FAC-${Date.now().toString().slice(-6)}`;
    const requester = req.user || store.users[0];

    const newSale: Sale = {
      id: `sal-${Date.now()}`,
      saleNumber,
      items: validatedItems,
      subtotal,
      discount: discountVal,
      total,
      amountPaid: paid,
      remainingAmount: remaining,
      totalCost,
      grossMargin,
      paymentMethod,
      customerName: customerName?.trim() || "Client Comptoir",
      customerPhone: customerPhone?.trim() || "",
      status: 'COMPLETED',
      notes,
      createdBy: requester.uid,
      createdByName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    };

    store.sales.unshift(newSale);

    // 3. Atomically decrement stock & log movement
    for (const it of validatedItems) {
      const prod = store.products.find(p => p.id === it.productId)!;
      const prevStock = prod.currentStock;
      const newStock = prevStock - it.quantity;

      prod.currentStock = newStock;
      prod.updatedAt = new Date().toISOString();
      store.recalculateProductStock(prod.id);

      store.stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id,
        productName: prod.name,
        type: 'SALE',
        quantity: -it.quantity, // negative
        previousStock: prevStock,
        newStock: newStock,
        referenceId: newSale.id,
        referenceNumber: newSale.saleNumber,
        reason: `Vente caisse #${newSale.saleNumber} (${newSale.customerName})`,
        userId: requester.uid,
        userName: `${requester.firstName} ${requester.lastName}`,
        createdAt: new Date().toISOString()
      });
    }

    // 4. Log in Audit Trail
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'SALES', newSale.id,
      `Vente ${newSale.saleNumber} de ${total} CDF enregistrée par ${requester.firstName} ${requester.lastName}`
    );

    return res.status(201).json({
      success: true,
      message: "Vente validée et facture émise avec succès.",
      data: newSale
    });
  }

  /**
   * POST /api/sales/:id/cancel
   * Annulation de vente (Administrateur uniquement) avec restitution de stock
   */
  static async cancel(req: Request, res: Response) {
    const sale = store.sales.find(s => s.id === req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Vente non trouvée" });

    if (sale.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: "Cette vente a déjà été annulée." });
    }

    const { reason = "Annulation demandée par la direction" } = req.body;
    const requester = req.user || store.users[0];

    sale.status = 'CANCELLED';

    // Restore stock
    for (const it of sale.items) {
      const prod = store.products.find(p => p.id === it.productId);
      if (prod) {
        const prevStock = prod.currentStock;
        const newStock = prevStock + it.quantity;
        prod.currentStock = newStock;
        prod.updatedAt = new Date().toISOString();
        store.recalculateProductStock(prod.id);

        store.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'RETURN',
          quantity: it.quantity,
          previousStock: prevStock,
          newStock: newStock,
          referenceId: sale.id,
          referenceNumber: sale.saleNumber,
          reason: `Restitution après annulation vente ${sale.saleNumber} : ${reason}`,
          userId: requester.uid,
          userName: `${requester.firstName} ${requester.lastName}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CANCEL', 'SALES', sale.id,
      `Annulation de la vente ${sale.saleNumber} (${sale.total} CDF). Motif : ${reason}`
    );

    return res.json({
      success: true,
      message: "Vente annulée avec succès et stocks réintégrés.",
      data: sale
    });
  }
}
