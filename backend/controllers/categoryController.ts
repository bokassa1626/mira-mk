import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Category } from '../../src/types/index.ts';

export class CategoryController {
  static async getAll(_req: Request, res: Response) {
    return res.json({ success: true, count: store.categories.length, data: store.categories });
  }

  static async getById(req: Request, res: Response) {
    const category = store.categories.find(c => c.id === req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Catégorie non trouvée." });
    }
    return res.json({ success: true, data: category });
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

  static async update(req: Request, res: Response) {
    const category = store.categories.find(c => c.id === req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Catégorie non trouvée." });
    }

    const { name, code, description } = req.body;
    if (name) category.name = name.trim();
    if (code) category.code = code.trim().toUpperCase();
    if (description !== undefined) category.description = description;

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'CATEGORIES', category.id,
      `Mise à jour de la catégorie ${category.name}`
    );

    return res.json({ success: true, message: "Catégorie mise à jour", data: category });
  }

  static async delete(req: Request, res: Response) {
    const index = store.categories.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Catégorie non trouvée." });
    }

    const cat = store.categories[index]!;
    // Check if products exist in category
    const hasProducts = store.products.some(p => p.categoryId === cat.id && (p.status as string) !== 'ARCHIVED');
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer cette catégorie car des produits actifs y sont rattachés."
      });
    }

    store.categories.splice(index, 1);
    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'DELETE', 'CATEGORIES', cat.id,
      `Suppression de la catégorie ${cat.name}`
    );

    return res.json({ success: true, message: "Catégorie supprimée avec succès." });
  }
}
