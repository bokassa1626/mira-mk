import { Router } from 'express';
import { ReportController } from '../controllers/reportController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const reportRouter = Router();

reportRouter.use(authenticateToken);

reportRouter.get('/dashboard', requireAnyStaff, ReportController.getDashboard);
reportRouter.get('/daily', requireAnyStaff, ReportController.getDaily);
reportRouter.get('/analytics', requireAnyStaff, ReportController.getAnalytics);
