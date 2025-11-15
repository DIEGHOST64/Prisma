// filepath: src/presentation/routes/authRoutes.ts
// 🌐 PRESENTATION LAYER - Routes Definition

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate, registerSchema, loginSchema, refreshTokenSchema } from '../middlewares/validationMiddleware';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  // Public routes
  router.post(
    '/register',
    validate(registerSchema),
    authController.register.bind(authController)
  );

  router.post(
    '/login',
    validate(loginSchema),
    authController.login.bind(authController)
  );

  router.post(
    '/refresh',
    validate(refreshTokenSchema),
    authController.refresh.bind(authController)
  );

  // Protected routes
  router.get(
    '/me',
    authMiddleware,
    authController.getProfile.bind(authController)
  );

  router.post(
    '/logout',
    authMiddleware,
    authController.logout.bind(authController)
  );

  return router;
};
