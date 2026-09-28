import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Product } from '../../src/types/index.ts';

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const { category, search, status } = req.query;
    let list = [...store.products];

    if (category && category !== 'ALL') {
      list = list.filter(p => p.categoryId === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter(p => p.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }

    return res.json({ success: true, count: list.length, data: list });
  }

  static async getById(req: Request, res: Response) {
    const product = store.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });
    return res.json({ success: true, data: product });
  }

  static async create(req: Request, res: Response) {
    const { name, code, categoryId, unit, purchasePrice, sellingPrice, initialStock, minimumStock, supplierId } = req.body;
    if (!name || !code || !categoryId || !purchasePrice || !sellingPrice) {
      return res.status(400).json({ success: false, message: "Veuillez renseigner tous les champs obligatoires." });
    }

    const stockVal = Number(initialStock) || 0;
    const minStockVal = Number(minimumStock) || 15;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      categoryId,
      unit: unit || 'kg',
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      initialStock: stockVal,
      currentStock: stockVal,
      minimumStock: minStockVal,
      supplierId: supplierId || 'sup-1',
      status: stockVal > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.products.push(newProduct);

    // Initial stock movement if stock > 0
    if (stockVal > 0) {
      store.stockMovements.unshift({
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ADJUSTMENT',
        quantity: stockVal,
        previousStock: 0,
        newStock: stockVal,
        reason: "Stock initial à la création du produit",
        userId: req.user?.uid || 'usr-1',
        userName: `${req.user?.firstName || 'Bokassa'} ${req.user?.lastName || 'Ntwali'}`,
        createdAt: new Date().toISOString()
      });
    }

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'PRODUCTS', newProduct.id,
      `Création du produit ${newProduct.name} (${newProduct.code}) avec un stock initial de ${stockVal} ${newProduct.unit}`
    );

    return res.status(201).json({ success: true, data: newProduct });
  }

  static async update(req: Request, res: Response) {
    const product = store.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Produit non trouvé" });

    const { name, code, categoryId, unit, purchasePrice, sellingPrice, minimumStock, supplierId } = req.body;
    if (name) product.name = name;
    if (code) product.code = code.toUpperCase();
    if (categoryId) product.categoryId = categoryId;
    if (unit) product.unit = unit;
    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (minimumStock !== undefined) product.minimumStock = Number(minimumStock);
    if (supplierId) product.supplierId = supplierId;

    product.updatedAt = new Date().toISOString();
    store.recalculateProductStock(product.id);

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'PRODUCTS', product.id,
      `Modification du produit ${product.name} (${product.code})`
    );

    return res.json({ success: true, data: product });
  }

  static async delete(req: Request, res: Response) {
    const index = store.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Produit non trouvé" });

    const [deleted] = store.products.splice(index, 1);
    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'DELETE', 'PRODUCTS', deleted.id,
      `Suppression du produit ${deleted.name} (${deleted.code})`
    );

    return res.json({ success: true, message: "Produit supprimé", data: deleted });
  }
}
