import { Request, Response } from 'express';
import { adminAuth } from '../config/firebaseAdmin.ts';
import { store } from '../config/firestore.ts';
import { User, Role } from '../../src/types/index.ts';

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticate user with Firebase ID token or credentials / demo switcher
   */
  static async login(req: Request, res: Response) {
    try {
      const { idToken, email, role, uid } = req.body;
      let user: User | undefined;

      // 1. If an ID Token is provided, verify via Firebase Admin SDK
      if (idToken) {
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          user = store.users.find(u => u.uid === decoded.uid || u.email.toLowerCase() === decoded.email?.toLowerCase());

          if (!user) {
            // Provision user profile if first time
            const names = (decoded.name || 'Utilisateur Mira-Mk').split(' ');
            user = {
              uid: decoded.uid,
              email: decoded.email || `${decoded.uid}@boucheriemiramk.cd`,
              firstName: names[0] || 'Utilisateur',
              lastName: names.slice(1).join(' ') || 'Mira-Mk',
              phone: "+243 000 000 000",
              role: 'ADMINISTRATEUR', // Default initial role
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            store.users.push(user);
          }
        } catch (tokenErr: any) {
          // If demo token
          if (typeof idToken === 'string' && idToken.startsWith('demo-token-')) {
            const requestedRole = idToken.replace('demo-token-', '').toUpperCase() as Role;
            user = store.users.find(u => u.role === requestedRole) || store.users[0];
          } else {
            return res.status(401).json({
              success: false,
              message: "Token Firebase Admin invalide ou expiré.",
              error: tokenErr?.message
            });
          }
        }
      } else if (uid) {
        user = store.users.find(u => u.uid === uid);
      } else if (email) {
        user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      } else if (role) {
        user = store.users.find(u => u.role === role);
      }

      // Fallback to first user matching role or default admin
      if (!user) {
        user = store.users.find(u => u.role === role) || store.users[0]!;
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Aucun utilisateur trouvé."
        });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({
          success: false,
          message: "Ce compte utilisateur a été suspendu par l'administration."
        });
      }

      // Update lastLogin timestamp
      user.lastLogin = new Date().toISOString();

      // Log in audit trail
      store.logAudit(
        user.uid,
        user.email,
        user.role,
        'LOGIN',
        'AUTH',
        user.uid,
        `Connexion de l'utilisateur ${user.firstName} ${user.lastName} (${user.role}) via Firebase Admin`
      );

      // Return user data along with demo session token
      return res.json({
        success: true,
        message: "Connexion réussie avec succès",
        token: `mira-session-${user.uid}-${Date.now()}`,
        data: user
      });
    } catch (error: any) {
      console.error('[AuthController.login] Error:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la connexion utilisateur.",
        error: error?.message
      });
    }
  }

  /**
   * POST /api/auth/verify-token
   * Validates Firebase ID Token and returns user payload
   */
  static async verifyToken(req: Request, res: Response) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: "Paramètre 'idToken' manquant."
        });
      }

      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const user = store.users.find(u => u.uid === decodedToken.uid || u.email.toLowerCase() === decodedToken.email?.toLowerCase());

      return res.json({
        success: true,
        valid: true,
        claims: decodedToken,
        user: user || null
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: "Token Firebase ID invalide.",
        error: err.message
      });
    }
  }

  /**
   * POST /api/auth/session
   * Generates a Firebase Auth Session Cookie for cookie-based auth
   */
  static async createSessionCookie(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, message: "Token ID manquant." });
      }

      // 5 days expiration
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      let sessionCookie: string;

      try {
        sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      } catch {
        // Fallback session identifier in dev
        sessionCookie = `session-${Date.now()}`;
      }

      res.cookie('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      return res.json({
        success: true,
        message: "Session cookie initialisé avec succès.",
        sessionCookie
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la session.",
        error: err.message
      });
    }
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user
   */
  static async getMe(req: Request, res: Response) {
    const user = req.user || store.users[0];
    return res.json({
      success: true,
      data: user
    });
  }

  /**
   * POST /api/auth/logout
   * Destroys user session and logs audit event
   */
  static async logout(req: Request, res: Response) {
    const user = req.user;

    res.clearCookie('session');

    if (user) {
      store.logAudit(
        user.uid,
        user.email,
        user.role,
        'LOGIN',
        'AUTH',
        user.uid,
        `Déconnexion de l'utilisateur ${user.firstName} ${user.lastName} (${user.role})`
      );
    }

    return res.json({
      success: true,
      message: "Déconnexion réussie."
    });
  }

  /**
   * POST /api/auth/sync-user
   * Synchronizes user profile after Firebase client authentication
   */
  static async syncUser(req: Request, res: Response) {
    try {
      const { uid, email, displayName, photoURL } = req.body;

      if (!uid) {
        return res.status(400).json({ success: false, message: "Paramètre 'uid' requis." });
      }

      let existing = store.users.find(u => u.uid === uid);

      if (existing) {
        existing.updatedAt = new Date().toISOString();
        if (photoURL) existing.photoURL = photoURL;
        return res.json({ success: true, data: existing });
      }

      const names = (displayName || '').split(' ');
      const newUser: User = {
        uid,
        email: email || `${uid}@boucheriemiramk.cd`,
        firstName: names[0] || 'Employé',
        lastName: names.slice(1).join(' ') || 'Mira-Mk',
        phone: "+243 000 000 000",
        role: store.users.length === 0 ? 'ADMINISTRATEUR' : 'VENDEUR',
        status: 'ACTIVE',
        photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      store.users.push(newUser);
      return res.status(201).json({ success: true, data: newUser });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
