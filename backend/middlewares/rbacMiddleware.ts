import { Request, Response, NextFunction } from 'express';
import { Role } from '../../src/types/index.ts';

/**
 * RBAC Middleware: Enforces that the authenticated user possesses one of the allowed roles.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise pour effectuer cette opération."
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Cette action requiert l'un des rôles suivants : [${allowedRoles.join(', ')}]. Votre rôle actuel est : ${user.role}.`
      });
    }

    next();
  };
}

/**
 * Quick role helpers
 */
export const requireAdmin = requireRole('ADMINISTRATEUR');
export const requireManagerOrAdmin = requireRole('ADMINISTRATEUR', 'GESTIONNAIRE');
export const requireAuditorOrAdmin = requireRole('ADMINISTRATEUR', 'CONTROLEUR');
export const requireCashierOrAdmin = requireRole('ADMINISTRATEUR', 'VENDEUR');
export const requireAnyStaff = requireRole('ADMINISTRATEUR', 'GESTIONNAIRE', 'VENDEUR', 'CONTROLEUR');
