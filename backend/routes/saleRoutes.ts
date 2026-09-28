import { Router } from 'express';
import { SaleController } from '../controllers/saleController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const saleRouter = Router();

saleRouter.use(authenticateToken);

saleRouter.get('/', requireAnyStaff, SaleController.getAll);
saleRouter.get('/:id', requireAnyStaff, SaleController.getById);
saleRouter.post('/', requireAnyStaff, SaleController.create);
saleRouter.post('/:id/cancel', requireAdmin, SaleController.cancel);
