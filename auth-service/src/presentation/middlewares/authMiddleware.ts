// filepath: src/presentation/middlewares/authMiddleware.ts
// 🌐 PRESENTATION LAYER - Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../infrastructure/persistence/TokenService';

const tokenService = new TokenService();

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    const payload = tokenService.verifyToken(token);
    
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Agregar usuario al request
    (req as any).user = payload;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
