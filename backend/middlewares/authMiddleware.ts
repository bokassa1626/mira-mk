import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebaseAdmin.ts';
import { store } from '../config/firestore.ts';
import { User, Role } from '../../src/types/index.ts';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      firebaseUid?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using Firebase Admin SDK
 * Accepts ID Token from 'Authorization: Bearer <token>' or session cookie 'session'
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check Authorization Header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1]?.trim();
    }

    // 2. Check Session Cookie if no Bearer token
    if (!token && (req as any).cookies?.session) {
      const sessionCookie = (req as any).cookies.session;
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        req.firebaseUid = decodedClaims.uid;
        const appUser = findOrBuildUser(decodedClaims.uid, decodedClaims.email);
        req.user = appUser;
        return next();
      } catch {
        // Session cookie invalid or expired, continue to check other options
      }
    }

    // 3. Check for dev/demo override header (e.g. x-user-id or x-user-role)
    const customUserId = req.headers['x-user-id'] as string;
    const customUserRole = req.headers['x-user-role'] as Role;

    if (!token) {
      if (customUserId) {
        const found = store.users.find(u => u.uid === customUserId);
        if (found) {
          req.user = found;
          req.firebaseUid = found.uid;
          return next();
        }
      }
      if (customUserRole) {
        const foundByRole = store.users.find(u => u.role === customUserRole);
        if (foundByRole) {
          req.user = foundByRole;
          req.firebaseUid = foundByRole.uid;
          return next();
        }
      }

      // Default demo user fallback for smooth internal dev calls if not specified
      req.user = store.users[0];
      req.firebaseUid = store.users[0]?.uid;
      return next();
    }

    // 4. Verify ID Token with Firebase Admin SDK
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.firebaseUid = decodedToken.uid;

      // Match with application user in database
      const appUser = findOrBuildUser(decodedToken.uid, decodedToken.email, decodedToken.name);
      
      if (appUser.status === 'INACTIVE') {
        return res.status(403).json({
          success: false,
          message: "Compte utilisateur désactivé. Veuillez contacter l'administrateur de la Boucherie Mira-Mk."
        });
      }

      req.user = appUser;
      return next();
    } catch (firebaseErr: any) {
      // Check if it's a demo token
      if (token.startsWith('demo-token-')) {
        const demoRole = token.replace('demo-token-', '').toUpperCase() as Role;
        const matchingUser = store.users.find(u => u.role === demoRole) || store.users[0];
        req.user = matchingUser;
        req.firebaseUid = matchingUser?.uid;
        return next();
      }

      console.warn('[AuthMiddleware] ID token verification failed:', firebaseErr?.message || firebaseErr);
      return res.status(401).json({
        success: false,
        message: "Token d'authentification invalide ou expiré.",
        error: firebaseErr?.message || 'Unauthorized'
      });
    }
  } catch (error: any) {
    console.error('[AuthMiddleware] Unexpected auth error:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la vérification de l'authentification.",
      error: error?.message
    });
  }
}

/**
 * Helper to retrieve user profile from store or create a default active profile
 */
function findOrBuildUser(uid: string, email?: string, name?: string): User {
  let user = store.users.find(u => u.uid === uid || (email && u.email.toLowerCase() === email.toLowerCase()));

  if (!user) {
    const names = (name || 'Utilisateur Mira-Mk').split(' ');
    const firstName = names[0] || 'Utilisateur';
    const lastName = names.slice(1).join(' ') || 'Mira-Mk';

    const newUser: User = {
      uid,
      email: email || `${uid}@boucheriemiramk.cd`,
      firstName,
      lastName,
      phone: "+243 000 000 000",
      role: 'VENDEUR', // default role
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.users.push(newUser);
    return newUser;
  }

  return user;
}
