import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { InventorySession, InventoryItem } from '../../src/types/index.ts';

export class InventoryController {
  static async getAll(_req: Request, res: Response) {
    return res.json({ success: true, count: store.inventorySessions.length, data: store.inventorySessions });
  }

  static async getById(req: Request, res: Response) {
    const session = store.inventorySessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session d'inventaire non trouvée" });
    return res.json({ success: true, data: session });
  }

  /**
   * POST /api/inventory
   * Crée ou soumet un inventaire physique avec comparaison stock théorique vs physique
   */
  static async create(req: Request, res: Response) {
    const { title, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Les comptages physiques sont requis." });
    }

    const requester = req.user || store.users[0];
    let totalDiscrepancyValue = 0;
    const computedItems: InventoryItem[] = [];

    for (const it of items) {
      const prod = store.products.find(p => p.id === it.productId);
      if (!prod) continue;

      const theoretical = prod.currentStock;
      const physical = Number(it.physicalStock);
      const diff = physical - theoretical;
      const diffVal = diff * prod.purchasePrice;
      totalDiscrepancyValue += diffVal;

      computedItems.push({
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        theoreticalStock: theoretical,
        physicalStock: physical,
        difference: diff,
        unitPurchasePrice: prod.purchasePrice,
        differenceValue: diffVal,
        notes: it.notes || ''
      });
    }

    const sessionNumber = `INV-${Date.now().toString().slice(-6)}`;
    const newSession: InventorySession = {
      id: `inv-${Date.now()}`,
      sessionNumber,
      title: title?.trim() || `Inventaire physique général du ${new Date().toLocaleDateString('fr-FR')}`,
      status: 'DRAFT',
      items: computedItems,
      totalDifferenceValue: totalDiscrepancyValue,
      totalDiscrepancyValue,
      notes,
      conductedBy: requester.uid,
      conductedByName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    };

    store.inventorySessions.unshift(newSession);

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'INVENTORY', newSession.id,
      `Création de la session d'inventaire #${newSession.sessionNumber} avec ${computedItems.length} produits comptés`
    );

    return res.status(201).json({
      success: true,
      message: "Session d'inventaire créée avec succès.",
      data: newSession
    });
  }

  /**
   * POST /api/inventory/:id/validate
   * Valide l'inventaire et ajuste automatiquement les stocks physiques
   */
  static async validate(req: Request, res: Response) {
    const session = store.inventorySessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session d'inventaire non trouvée" });

    if (session.status === 'VALIDATED') {
      return res.status(400).json({ success: false, message: "Cette session d'inventaire a déjà été validée." });
    }

    const requester = req.user || store.users[0];
    session.status = 'VALIDATED';
    session.validatedBy = requester.uid;
    session.validatedByName = `${requester.firstName} ${requester.lastName}`;
    session.validatedAt = new Date().toISOString();

    // Apply adjustments
    for (const it of session.items) {
      if (it.difference !== 0) {
        const prod = store.products.find(p => p.id === it.productId);
        if (prod) {
          const prev = prod.currentStock;
          prod.currentStock = it.physicalStock;
          prod.updatedAt = new Date().toISOString();
          store.recalculateProductStock(prod.id);

          store.stockMovements.unshift({
            id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            productId: prod.id,
            productName: prod.name,
            type: 'INVENTORY',
            quantity: it.difference,
            previousStock: prev,
            newStock: it.physicalStock,
            referenceId: session.id,
            referenceNumber: session.sessionNumber,
            reason: `Ajustement d'inventaire physique #${session.sessionNumber} (${it.difference > 0 ? '+' : ''}${it.difference} ${it.unit})`,
            userId: requester.uid,
            userName: `${requester.firstName} ${requester.lastName}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'VALIDATE', 'INVENTORY', session.id,
      `Validation de l'inventaire #${session.sessionNumber} par ${session.validatedByName} : ajustements appliqués`
    );

    return res.json({
      success: true,
      message: "Inventaire validé et stocks mis à jour avec succès.",
      data: session
    });
  }
}
