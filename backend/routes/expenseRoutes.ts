import { Router } from 'express';
import { ExpenseController } from '../controllers/expenseController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAdmin, requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const expenseRouter = Router();

expenseRouter.use(authenticateToken);

expenseRouter.get('/', requireAnyStaff, ExpenseController.getAll);
expenseRouter.post('/', requireManagerOrAdmin, ExpenseController.create);
expenseRouter.delete('/:id', requireAdmin, ExpenseController.delete);
