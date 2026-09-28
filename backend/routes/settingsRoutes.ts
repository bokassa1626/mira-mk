import { Router } from 'express';
import { store } from '../config/firestore.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const settingsRouter = Router();

settingsRouter.use(authenticateToken);

settingsRouter.get('/', requireAnyStaff, (_req, res) => {
  return res.json({ success: true, data: store.settings });
});

settingsRouter.put('/', requireAdmin, (req, res) => {
  const requester = req.user || store.users[0];
  store.settings = { ...store.settings, ...req.body };
  store.logAudit(
    requester.uid,
    requester.email,
    requester.role,
    'UPDATE',
    'SETTINGS',
    'settings',
    "Mise à jour des paramètres de la Boucherie Mira-Mk"
  );
  return res.json({ success: true, message: "Paramètres enregistrés", data: store.settings });
});
