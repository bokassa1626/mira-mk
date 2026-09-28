import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Category } from '../../src/types/index.ts';

export class CategoryController {
  static async getAll(_req: Request, res: Response) {
    return res.json({ success: true, count: store.categories.length, data: store.categories });
  }

  static async create(req: Request, res: Response) {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Nom et code de catégorie requis." });
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description || '',
      createdAt: new Date().toISOString()
    };

    store.categories.push(newCategory);
    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'CATEGORIES', newCategory.id,
      `Création de la catégorie de viandes ${newCategory.name} (${newCategory.code})`
    );

    return res.status(201).json({ success: true, data: newCategory });
  }
}
