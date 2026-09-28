import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';

export class AuditController {
  static async getAll(req: Request, res: Response) {
    const { module, action, limit = 100 } = req.query;
    let list = [...store.auditLogs];

    if (module && module !== 'ALL') {
      list = list.filter(l => l.module === module);
    }
    if (action && action !== 'ALL') {
      list = list.filter(l => l.action === action);
    }

    const max = Number(limit) || 100;
    return res.json({
      success: true,
      count: list.length,
      data: list.slice(0, max)
    });
  }

  static async getSettings(_req: Request, res: Response) {
    return res.json({
      success: true,
      data: store.settings
    });
  }

  static async updateSettings(req: Request, res: Response) {
    const { companyName, address, phone, email, currency, secondaryCurrency, exchangeRate, defaultStockThreshold } = req.body;
    if (companyName) store.settings.companyName = companyName;
    if (address) store.settings.address = address;
    if (phone) store.settings.phone = phone;
    if (email) store.settings.email = email;
    if (currency) store.settings.currency = currency;
    if (secondaryCurrency) store.settings.secondaryCurrency = secondaryCurrency;
    if (exchangeRate) store.settings.exchangeRate = Number(exchangeRate);
    if (defaultStockThreshold) store.settings.defaultStockThreshold = Number(defaultStockThreshold);

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'SETTINGS', 'company-settings',
      `Mise à jour des paramètres de la boucherie par ${requester.firstName} ${requester.lastName}`
    );

    return res.json({
      success: true,
      message: "Paramètres mis à jour avec succès",
      data: store.settings
    });
  }
}
