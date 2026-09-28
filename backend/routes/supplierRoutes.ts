import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const supplierRouter = Router();

supplierRouter.use(authenticateToken);

supplierRouter.get('/', requireAnyStaff, SupplierController.getAll);
supplierRouter.get('/:id', requireAnyStaff, SupplierController.getById);
supplierRouter.post('/', requireManagerOrAdmin, SupplierController.create);
supplierRouter.put('/:id', requireManagerOrAdmin, SupplierController.update);
