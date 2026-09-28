import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticateToken } from '../middlewares/authMiddleware.ts';

export const authRouter = Router();

// Public auth endpoints
authRouter.post('/login', AuthController.login);
authRouter.post('/verify-token', AuthController.verifyToken);
authRouter.post('/session', AuthController.createSessionCookie);
authRouter.post('/sync-user', AuthController.syncUser);

// Authenticated session endpoints
authRouter.get('/me', authenticateToken, AuthController.getMe);
authRouter.post('/logout', authenticateToken, AuthController.logout);
