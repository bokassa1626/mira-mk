import { Router } from 'express';
import { LossController } from '../controllers/lossController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAuditorOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const lossRouter = Router();

lossRouter.use(authenticateToken);

lossRouter.get('/', requireAnyStaff, LossController.getAll);
lossRouter.post('/', requireAnyStaff, LossController.create);
lossRouter.put('/:id/approve', requireAuditorOrAdmin, LossController.approve);
