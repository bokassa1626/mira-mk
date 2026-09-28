import { Router } from 'express';
import { PurchaseController } from '../controllers/purchaseController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const purchaseRouter = Router();

purchaseRouter.use(authenticateToken);

purchaseRouter.get('/', requireAnyStaff, PurchaseController.getAll);
purchaseRouter.get('/:id', requireAnyStaff, PurchaseController.getById);
purchaseRouter.post('/', requireManagerOrAdmin, PurchaseController.create);
