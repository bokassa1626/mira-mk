import { Router } from 'express';
import { ProductController } from '../controllers/productController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const productRouter = Router();

productRouter.use(authenticateToken);

productRouter.get('/', requireAnyStaff, ProductController.getAll);
productRouter.get('/:id', requireAnyStaff, ProductController.getById);
productRouter.post('/', requireManagerOrAdmin, ProductController.create);
productRouter.put('/:id', requireManagerOrAdmin, ProductController.update);
productRouter.delete('/:id', requireManagerOrAdmin, ProductController.delete);
