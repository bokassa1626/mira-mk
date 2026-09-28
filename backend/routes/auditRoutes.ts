import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireAdmin, requireAuditorOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const auditRouter = Router();

auditRouter.use(authenticateToken);

auditRouter.get('/', requireAuditorOrAdmin, AuditController.getAll);
auditRouter.get('/settings', requireAnyStaff, AuditController.getSettings);
auditRouter.put('/settings', requireAdmin, AuditController.updateSettings);
