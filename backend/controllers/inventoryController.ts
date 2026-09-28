import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { InventorySession } from '../../src/types/index.ts';

export class InventoryController {
  static async getAll(_req: Request, res: Response) {
    return res.json({
      success: true,
      count: store.inventorySessions.length,
      data: store.inventorySessions
    });
  }

  static async getById(req: Request, res: Response) {
    const session = store.inventorySessions.find(s => s.id === req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session d'inventaire non trouvée." });
    }
    return res.json({ success: true, data: session });
  }

  /**
   * POST /api/inventory
   * Clôture un inventaire physique et régularise immédiatement les stocks
   */
  static async create(req: Request, res: Response) {
    const requester = req.user || store.users[0];
    if (requester.role === 'VENDEUR') {
      return res.status(403).json({ success: false, message: "Non autorisé à soumettre un inventaire." });
    }

    const { items, notes, title } = req.body;
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

        // Update product stock to match physical reality
        if (diff !== 0) {
          product.currentStock = phys;
          product.updatedAt = new Date().toISOString();

          store.stockMovements.unshift({
            id: `mov-${Date.now()}-${product.id}`,
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

          store.recalculateProductStock(product.id);
        }
      }
    }

    const sessionNumber = `INV-${new Date().getFullYear()}-${String(store.inventorySessions.length + 1).padStart(2, '0')}`;

    const session: InventorySession = {
      id: `inv-${Date.now()}`,
      sessionNumber,
      title: title || `Inventaire physique général du ${new Date().toLocaleDateString('fr-FR')}`,
      status: 'VALIDATED',
      items: processedItems,
      totalDifferenceValue: totalDiffVal,
      totalDiscrepancyValue: totalDiffVal,
      notes,
      conductedBy: requester.uid,
      conductedByName: `${requester.firstName} ${requester.lastName}`,
      validatedBy: requester.uid,
      validatedByName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString(),
      validatedAt: new Date().toISOString()
    };

    store.inventorySessions.unshift(session);
    store.logAudit(
      requester.uid,
      requester.email,
      requester.role,
      'VALIDATE',
      'INVENTORY',
      session.id,
      `Clôture inventaire ${sessionNumber}, Écart total: ${totalDiffVal} CDF`
    );

    return res.status(201).json({
      success: true,
      message: "Inventaire validé et stocks mis à jour",
      data: session
    });
  }

  static async validate(req: Request, res: Response) {
    return InventoryController.create(req, res);
  }
}
