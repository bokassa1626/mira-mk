import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const categoryRouter = Router();

categoryRouter.use(authenticateToken);

categoryRouter.get('/', requireAnyStaff, CategoryController.getAll);
categoryRouter.post('/', requireManagerOrAdmin, CategoryController.create);
