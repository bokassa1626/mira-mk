import { Router } from 'express';
import { AlertController } from '../controllers/alertController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const alertRouter = Router();

alertRouter.use(authenticateToken);

alertRouter.get('/', requireAnyStaff, AlertController.getAll);
