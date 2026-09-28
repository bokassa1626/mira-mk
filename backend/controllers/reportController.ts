import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';

export class ReportController {
  /**
   * GET /api/reports/dashboard
   * Résumé exécutif complet pour le tableau de bord de la boucherie
   */
  static async getDashboard(_req: Request, res: Response) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const validSales = store.sales.filter(s => s.status === 'COMPLETED');
    const todaySales = validSales.filter(s => s.createdAt.slice(0, 10) === todayStr);

    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
    const todayCost = todaySales.reduce((acc, s) => acc + s.totalCost, 0);
    const todayGrossMargin = todayRevenue - todayCost;

    const todayPurchases = store.purchases
      .filter(p => (p.status === 'VALIDATED' || p.status === 'COMPLETED') && p.createdAt.slice(0, 10) === todayStr)
      .reduce((acc, p) => acc + p.total, 0);

    const todayExpenses = store.expenses
      .filter(e => e.createdAt.slice(0, 10) === todayStr)
      .reduce((acc, e) => acc + e.amount, 0);

    const todayLosses = store.losses
      .filter(l => (l.status === 'APPROVED') && l.createdAt.slice(0, 10) === todayStr)
      .reduce((acc, l) => acc + (l.totalValue || l.totalLossValue || 0), 0);

    const todayNetProfit = todayGrossMargin - todayExpenses - todayLosses;

    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of store.products) {
      if ((p.status as string) !== 'ARCHIVED') {
        totalStockValue += p.currentStock * p.purchasePrice;
        if (p.currentStock <= 0) outOfStockCount++;
        else if (p.currentStock <= p.minimumStock) lowStockCount++;
      }
    }

    const salesByCategoryMap: Record<string, number> = {};
    for (const sale of validSales) {
      for (const item of sale.items) {
        const prod = store.products.find(p => p.id === item.productId);
        const catName = prod ? (store.categories.find(c => c.id === prod.categoryId)?.name || 'Autres') : 'Autres';
        salesByCategoryMap[catName] = (salesByCategoryMap[catName] || 0) + item.total;
      }
    }

    const categorySalesData = Object.entries(salesByCategoryMap).map(([name, value]) => ({ name, value }));

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
          totalProducts: store.products.filter(p => (p.status as string) !== 'ARCHIVED').length,
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
  }

  /**
   * GET /api/reports/daily
   */
  static async getDaily(req: Request, res: Response) {
    const dateQuery = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const sales = store.sales.filter(s => s.status === 'COMPLETED' && s.createdAt.slice(0, 10) === dateQuery);
    const purchases = store.purchases.filter(p => (p.status === 'VALIDATED' || p.status === 'COMPLETED') && p.createdAt.slice(0, 10) === dateQuery);
    const expenses = store.expenses.filter(e => e.createdAt.slice(0, 10) === dateQuery);
    const losses = store.losses.filter(l => l.status === 'APPROVED' && l.createdAt.slice(0, 10) === dateQuery);
    const movements = store.stockMovements.filter(m => m.createdAt.slice(0, 10) === dateQuery);

    const totalSales = sales.reduce((a, b) => a + b.total, 0);
    const totalCost = sales.reduce((a, b) => a + b.totalCost, 0);
    const grossMargin = totalSales - totalCost;
    const totalPurchases = purchases.reduce((a, b) => a + b.total, 0);
    const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
    const totalLosses = losses.reduce((a, b) => a + (b.totalValue || b.totalLossValue || 0), 0);
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
  }

  static async getAnalytics(_req: Request, res: Response) {
    return ReportController.getDashboard(_req, res);
  }
}
