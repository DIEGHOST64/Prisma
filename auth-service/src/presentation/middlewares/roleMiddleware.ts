// filepath: src/presentation/middlewares/roleMiddleware.ts
// 🌐 PRESENTATION LAYER - Role Authorization Middleware

import { Request, Response, NextFunction } from 'express';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - No user found'
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden - Insufficient permissions',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

// Shortcut middlewares
export const requireAdmin = requireRole('admin');
export const requireRecruiter = requireRole('admin', 'recruiter');
