import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { StockMovement } from '../../src/types/index.ts';

export class StockController {
  static async getOverview(_req: Request, res: Response) {
    let totalValuation = 0;
    let totalWeightKg = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of store.products) {
      if ((p.status as string) !== 'ARCHIVED') {
        totalValuation += p.currentStock * p.purchasePrice;
        if (p.unit === 'kg') totalWeightKg += p.currentStock;
        if (p.currentStock <= 0) outOfStockCount++;
        else if (p.currentStock <= p.minimumStock) lowStockCount++;
      }
    }

    const filteredProducts = store.products.filter(p => (p.status as string) !== 'ARCHIVED');

    return res.json({
      success: true,
      data: {
        products: filteredProducts,
        summary: {
          totalProducts: filteredProducts.length,
          totalValuation,
          totalWeightKg: Math.round(totalWeightKg * 100) / 100,
          lowStockCount,
          outOfStockCount
        }
      }
    });
  }

  static async getMovements(req: Request, res: Response) {
    const { productId, type } = req.query;
    let list = [...store.stockMovements];

    if (productId && productId !== 'ALL') {
      list = list.filter(m => m.productId === productId);
    }
    if (type && type !== 'ALL') {
      list = list.filter(m => m.type === type);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({
      success: true,
      count: list.length,
      data: list
    });
  }

  /**
   * POST /api/stock/adjust
   * Body: { productId, newStock, reason } or { productId, quantity, reason }
   */
  static async adjust(req: Request, res: Response) {
    const requester = req.user || store.users[0];
    if (requester.role === 'VENDEUR') {
      return res.status(403).json({ success: false, message: "Non autorisé à faire un ajustement de stock." });
    }

    const { productId, newStock, quantity, reason } = req.body;
    if (!productId || (newStock === undefined && quantity === undefined) || !reason) {
      return res.status(400).json({ success: false, message: "Produit, quantité/nouveau stock et motif obligatoires." });
    }

    const product = store.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

    const previousStock = product.currentStock;
    const targetStock = newStock !== undefined ? Number(newStock) : previousStock + Number(quantity);
    const difference = targetStock - previousStock;

    if (targetStock < 0) {
      return res.status(400).json({ success: false, message: "Le stock ne peut pas être négatif." });
    }

    product.currentStock = targetStock;
    if (product.currentStock <= 0) product.status = 'OUT_OF_STOCK';
    else if (product.currentStock <= product.minimumStock) product.status = 'LOW_STOCK';
    else product.status = 'AVAILABLE';
    product.updatedAt = new Date().toISOString();

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
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
    store.logAudit(
      requester.uid,
      requester.email,
      requester.role,
      'STOCK_ADJUSTMENT',
      'STOCK',
      product.id,
      `Ajustement de stock pour ${product.name}: ${previousStock} -> ${targetStock} (${reason})`
    );

    return res.json({
      success: true,
      message: "Stock ajusté avec succès",
      data: product
    });
  }
}
