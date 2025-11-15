// filepath: src/presentation/routes/userRoutes.ts
//  PRESENTATION LAYER - User Management Routes (Admin only)

import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/roleMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import Joi from 'joi';

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'recruiter', 'user').required()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  name: Joi.string().min(2).max(100).optional(),
  role: Joi.string().valid('admin', 'recruiter', 'user').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'recruiter').required()
});

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();
  
  console.log('🚀 Creando rutas de usuarios - VERSION CON /:uuid/role');

  // Todas las rutas requieren autenticaci�n Y rol de admin
  router.use(authMiddleware, requireAdmin);

  // CRUD de usuarios
  router.post(
    '/',
    validate(createUserSchema),
    userController.createUser.bind(userController)
  );

  router.get(
    '/',
    userController.listUsers.bind(userController)
  );

  //  IMPORTANTE: Rutas específicas ANTES de rutas genéricas con parámetros
  // Ruta específica para actualizar rol (DEBE IR ANTES de /:uuid)
  router.put(
    '/:uuid/role',
    (req, res, next) => {
      console.log('🔍 PUT /:uuid/role - Body recibido:', JSON.stringify(req.body));
      console.log('🔍 PUT /:uuid/role - UUID:', req.params.uuid);
      next();
    },
    validate(updateRoleSchema),
    userController.updateUser.bind(userController)
  );

  router.get(
    '/:uuid',
    userController.getUser.bind(userController)
  );

  router.put(
    '/:uuid',
    validate(updateUserSchema),
    userController.updateUser.bind(userController)
  );

  router.delete(
    '/:uuid',
    userController.deleteUser.bind(userController)
  );

  return router;
};
