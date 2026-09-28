import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAuditorOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const inventoryRouter = Router();

inventoryRouter.use(authenticateToken);

inventoryRouter.get('/', requireAnyStaff, InventoryController.getAll);
inventoryRouter.get('/:id', requireAnyStaff, InventoryController.getById);
inventoryRouter.post('/', requireAuditorOrAdmin, InventoryController.create);
inventoryRouter.post('/:id/validate', requireAuditorOrAdmin, InventoryController.validate);
