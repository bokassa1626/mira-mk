import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Loss } from '../../src/types/index.ts';

export class LossController {
  static async getAll(_req: Request, res: Response) {
    const totalLostValue = store.losses.reduce((sum, l) => sum + (l.totalValue || l.totalLossValue || 0), 0);
    return res.json({
      success: true,
      count: store.losses.length,
      totalLostValue,
      data: store.losses
    });
  }

  static async create(req: Request, res: Response) {
    const { productId, type = 'DAMAGED', quantity, reason, notes } = req.body;

    if (!productId || !quantity || !reason) {
      return res.status(400).json({ success: false, message: "Produit, quantité et motif obligatoires." });
    }

    const prod = store.products.find(p => p.id === productId);
    if (!prod) return res.status(404).json({ success: false, message: "Produit non trouvé" });

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: "Quantité invalide." });
    }

    const prevStock = prod.currentStock;
    const newStock = Math.max(0, prevStock - qty);
    const unitPrice = prod.purchasePrice;
    const totalLossValue = qty * unitPrice;

    prod.currentStock = newStock;
    prod.updatedAt = new Date().toISOString();

    const requester = req.user || store.users[0];
    const newLoss: Loss = {
      id: `per-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit,
      quantity: qty,
      unitPrice,
      totalValue: totalLossValue,
      totalLossValue,
      type,
      reason,
      status: 'APPROVED',
      notes,
      reportedBy: requester.uid,
      reportedByName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    };

    store.losses.unshift(newLoss);

    // Stock movement
    store.stockMovements.unshift({
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: prod.id,
      productName: prod.name,
      type: 'LOSS',
      quantity: -qty, // negative
      previousStock: prevStock,
      newStock: newStock,
      referenceId: newLoss.id,
      reason: `Perte enregistrée : ${reason} (${type})`,
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    });

    store.recalculateProductStock(prod.id);

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'LOSSES', newLoss.id,
      `Perte de ${qty} ${prod.unit} sur ${prod.name} déclarée. Valeur : ${totalLossValue} CDF`
    );

    return res.status(201).json({
      success: true,
      message: "Déclaration de perte enregistrée et stock déduit avec succès.",
      data: newLoss
    });
  }

  static async approve(req: Request, res: Response) {
    const requester = req.user || store.users[0];
    if (requester.role === 'VENDEUR') {
      return res.status(403).json({ success: false, message: "Permission refusée." });
    }

    const loss = store.losses.find(l => l.id === req.params.id);
    if (!loss) return res.status(404).json({ success: false, message: "Perte non trouvée" });
    if (loss.status === 'APPROVED') return res.status(400).json({ success: false, message: "Déjà approuvée." });

    loss.status = 'APPROVED';
    loss.approvedBy = requester.uid;
    loss.approvedByName = `${requester.firstName} ${requester.lastName}`;

    const product = store.products.find(p => p.id === loss.productId);
    if (product) {
      const prev = product.currentStock;
      product.currentStock = Math.max(0, product.currentStock - loss.quantity);
      product.updatedAt = new Date().toISOString();
      store.recalculateProductStock(product.id);

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

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'VALIDATE', 'LOSSES', loss.id,
      `Approbation perte ${loss.productName} (-${loss.quantity})`
    );

    return res.json({ success: true, message: "Perte approuvée et stock ajusté", data: loss });
  }
}
