import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Backend API Error]', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Une erreur inattendue s'est produite sur le serveur.";

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
