import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const userRouter = Router();

userRouter.use(authenticateToken);

userRouter.get('/', requireAnyStaff, UserController.getAll);
userRouter.get('/:id', requireAnyStaff, UserController.getById);
userRouter.post('/', requireAdmin, UserController.create);
userRouter.put('/:id', requireAdmin, UserController.update);
userRouter.patch('/:id/toggle-status', requireAdmin, UserController.toggleStatus);
