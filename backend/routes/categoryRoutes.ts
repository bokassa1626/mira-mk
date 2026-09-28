import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const categoryRouter = Router();

categoryRouter.use(authenticateToken);

categoryRouter.get('/', requireAnyStaff, CategoryController.getAll);
categoryRouter.get('/:id', requireAnyStaff, CategoryController.getById);
categoryRouter.post('/', requireManagerOrAdmin, CategoryController.create);
categoryRouter.put('/:id', requireManagerOrAdmin, CategoryController.update);
categoryRouter.delete('/:id', requireManagerOrAdmin, CategoryController.delete);
