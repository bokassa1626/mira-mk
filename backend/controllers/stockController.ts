import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { StockMovement } from '../../src/types/index.ts';

export class StockController {
  static async getOverview(_req: Request, res: Response) {
    const totalProducts = store.products.length;
    const available = store.products.filter(p => p.status === 'AVAILABLE').length;
    const lowStock = store.products.filter(p => p.status === 'LOW_STOCK').length;
    const outOfStock = store.products.filter(p => p.status === 'OUT_OF_STOCK').length;

    const totalStockValueBuy = store.products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
    const totalStockValueSell = store.products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);

    return res.json({
      success: true,
      data: {
        totalProducts,
        available,
        lowStock,
        outOfStock,
        totalStockValueBuy,
        totalStockValueSell,
        potentialMargin: totalStockValueSell - totalStockValueBuy,
        products: store.products
      }
    });
  }

  static async getMovements(req: Request, res: Response) {
    const { productId, type, limit = 100 } = req.query;
    let list = [...store.stockMovements];

    if (productId && productId !== 'ALL') {
      list = list.filter(m => m.productId === productId);
    }
    if (type && type !== 'ALL') {
      list = list.filter(m => m.type === type);
    }

    const max = Number(limit) || 100;
    return res.json({
      success: true,
      count: list.length,
      data: list.slice(0, max)
    });
  }

  /**
   * POST /api/stock/adjust
   * Ajustement manuel contrôlé du stock
   */
  static async adjust(req: Request, res: Response) {
    const { productId, type = 'ADJUSTMENT', quantity, reason } = req.body;

    if (!productId || quantity === undefined || !reason) {
      return res.status(400).json({ success: false, message: "Produit, quantité et motif requis pour un ajustement." });
    }

    const product = store.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

    const qty = Number(quantity);
    const prevStock = product.currentStock;
    const newStock = prevStock + qty;

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: "L'ajustement résulterait en un stock négatif non autorisé." });
    }

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();
    store.recalculateProductStock(product.id);

    const requester = req.user || store.users[0];
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: type as any,
      quantity: qty,
      previousStock: prevStock,
      newStock: newStock,
      reason,
      userId: requester.uid,
      userName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    };

    store.stockMovements.unshift(movement);

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'STOCK', product.id,
      `Ajustement de stock sur ${product.name} (${qty > 0 ? '+' : ''}${qty} ${product.unit}). Motif : ${reason}`
    );

    return res.json({
      success: true,
      message: "Stock ajusté avec succès.",
      data: {
        product,
        movement
      }
    });
  }
}
