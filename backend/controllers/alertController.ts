import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';

export class AlertController {
  static async getAll(_req: Request, res: Response) {
    const lowStock = store.products.filter(
      p => (p.status as string) !== 'ARCHIVED' && p.currentStock > 0 && p.currentStock <= p.minimumStock
    );
    const outOfStock = store.products.filter(
      p => (p.status as string) !== 'ARCHIVED' && p.currentStock <= 0
    );
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
  }
}
