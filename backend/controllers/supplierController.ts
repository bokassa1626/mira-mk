import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { Supplier } from '../../src/types/index.ts';

export class SupplierController {
  static async getAll(_req: Request, res: Response) {
    return res.json({ success: true, count: store.suppliers.length, data: store.suppliers });
  }

  static async getById(req: Request, res: Response) {
    const supplier = store.suppliers.find(s => s.id === req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });

    // Purchase history with this supplier
    const purchases = store.purchases.filter(p => p.supplierId === supplier.id);

    return res.json({
      success: true,
      data: {
        ...supplier,
        purchases
      }
    });
  }

  static async create(req: Request, res: Response) {
    const { name, phone, email, address, contactPerson, categorySpecialty } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Nom et téléphone obligatoires." });
    }

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email || '',
      address: address || 'Lubumbashi, RDC',
      contactPerson: contactPerson || name,
      categorySpecialty: categorySpecialty || 'Bétail & Viandes',
      status: 'ACTIVE',
      totalPurchases: 0,
      totalDebt: 0,
      totalPurchased: 0,
      totalPaid: 0,
      outstandingDebt: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.suppliers.push(newSupplier);
    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'SUPPLIERS', newSupplier.id,
      `Ajout du fournisseur de viande ${newSupplier.name} (${newSupplier.phone})`
    );

    return res.status(201).json({ success: true, data: newSupplier });
  }

  static async update(req: Request, res: Response) {
    const supplier = store.suppliers.find(s => s.id === req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });

    const { name, phone, email, address, contactPerson, status } = req.body;
    if (name) supplier.name = name;
    if (phone) supplier.phone = phone;
    if (email) supplier.email = email;
    if (address) supplier.address = address;
    if (contactPerson) supplier.contactPerson = contactPerson;
    if (status) supplier.status = status;
    supplier.updatedAt = new Date().toISOString();

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'SUPPLIERS', supplier.id,
      `Mise à jour des coordonnées du fournisseur ${supplier.name}`
    );

    return res.json({ success: true, data: supplier });
  }
}
