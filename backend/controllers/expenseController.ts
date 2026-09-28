import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Expense } from '../../src/types/index.ts';

export class ExpenseController {
  static async getAll(req: Request, res: Response) {
    const { category, startDate, endDate } = req.query;
    let list = [...store.expenses];

    if (category && category !== 'ALL') {
      list = list.filter(e => e.category === category);
    }
    if (startDate && typeof startDate === 'string') {
      list = list.filter(e => e.createdAt >= startDate);
    }
    if (endDate && typeof endDate === 'string') {
      list = list.filter(e => e.createdAt <= endDate);
    }

    const totalAmount = list.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      success: true,
      count: list.length,
      totalAmount,
      data: list
    });
  }

  static async create(req: Request, res: Response) {
    const { category, description, amount, currency = 'CDF', paymentMethod = 'CASH', reference } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ success: false, message: "Catégorie, libellé et montant obligatoires." });
    }

    const requester = req.user || store.users[0];
    const newExpense: Expense = {
      id: `dep-${Date.now()}`,
      category,
      description: description.trim(),
      amount: Number(amount),
      currency,
      paymentMethod,
      reference,
      createdBy: requester.uid,
      createdByName: `${requester.firstName} ${requester.lastName}`,
      createdAt: new Date().toISOString()
    };

    store.expenses.unshift(newExpense);

    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'EXPENSES', newExpense.id,
      `Dépense de ${newExpense.amount} ${newExpense.currency} enregistrée : ${newExpense.description} (${newExpense.category})`
    );

    return res.status(201).json({
      success: true,
      message: "Dépense enregistrée avec succès.",
      data: newExpense
    });
  }

  static async delete(req: Request, res: Response) {
    const index = store.expenses.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Dépense non trouvée" });

    const [deleted] = store.expenses.splice(index, 1);
    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'DELETE', 'EXPENSES', deleted.id,
      `Suppression de la dépense ${deleted.description} (${deleted.amount} ${deleted.currency})`
    );

    return res.json({ success: true, message: "Dépense supprimée", data: deleted });
  }
}
