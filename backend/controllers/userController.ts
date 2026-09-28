import { Request, Response } from 'express';
import { store } from '../config/firestore.ts';
import { User } from '../../src/types/index.ts';

export class UserController {
  static async getAll(_req: Request, res: Response) {
    return res.json({ success: true, count: store.users.length, data: store.users });
  }

  static async getById(req: Request, res: Response) {
    const user = store.users.find(u => u.uid === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
    return res.json({ success: true, data: user });
  }

  static async create(req: Request, res: Response) {
    const { email, firstName, lastName, phone, role, status } = req.body;
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ success: false, message: "Tous les champs obligatoires doivent être renseignés." });
    }

    const newUser: User = {
      uid: `usr-${Date.now()}`,
      email,
      firstName,
      lastName,
      phone: phone || "+243 ",
      role: role || 'VENDEUR',
      status: status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.users.push(newUser);
    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'CREATE', 'USERS', newUser.uid,
      `Création de l'utilisateur ${newUser.firstName} ${newUser.lastName} avec le rôle ${newUser.role}`
    );

    return res.status(201).json({ success: true, data: newUser });
  }

  static async update(req: Request, res: Response) {
    const user = store.users.find(u => u.uid === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const { firstName, lastName, phone, role, status } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    user.updatedAt = new Date().toISOString();

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'USERS', user.uid,
      `Mise à jour des informations de l'utilisateur ${user.firstName} ${user.lastName}`
    );

    return res.json({ success: true, data: user });
  }

  static async toggleStatus(req: Request, res: Response) {
    const user = store.users.find(u => u.uid === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    user.updatedAt = new Date().toISOString();

    const requester = req.user || store.users[0];
    store.logAudit(
      requester.uid, requester.email, requester.role,
      'UPDATE', 'USERS', user.uid,
      `Changement de statut pour l'utilisateur ${user.firstName} ${user.lastName} : ${user.status}`
    );

    return res.json({ success: true, data: user });
  }
}
