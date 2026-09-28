import { Router } from 'express';
import { StockController } from '../controllers/stockController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { requireManagerOrAdmin, requireAnyStaff } from '../middlewares/rbacMiddleware.ts';

export const stockRouter = Router();

stockRouter.use(authenticateToken);

stockRouter.get('/overview', requireAnyStaff, StockController.getOverview);
stockRouter.get('/movements', requireAnyStaff, StockController.getMovements);
stockRouter.post('/adjust', requireManagerOrAdmin, StockController.adjust);
