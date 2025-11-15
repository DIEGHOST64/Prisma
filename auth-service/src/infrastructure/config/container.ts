// filepath: src/infrastructure/config/container.ts
// 🔧 INFRASTRUCTURE LAYER - Dependency Injection Container
// Aquí conectamos todas las capas respetando Clean Architecture

import { PostgresUserRepository } from '../persistence/PostgresUserRepository';
import { PasswordService } from '../persistence/PasswordService';
import { TokenService } from '../persistence/TokenService';
import { RegisterUserUseCase } from '../../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/usecases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../application/usecases/RefreshTokenUseCase';
import { GetUserProfileUseCase } from '../../application/usecases/GetUserProfileUseCase';
import { CreateUserByAdminUseCase } from '../../application/usecases/CreateUserByAdminUseCase';
import { ListUsersUseCase } from '../../application/usecases/ListUsersUseCase';
import { UpdateUserUseCase } from '../../application/usecases/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../application/usecases/DeleteUserUseCase';
import { AuthController } from '../../presentation/controllers/AuthController';
import { UserController } from '../../presentation/controllers/UserController';

// DEPENDENCY INJECTION - Respeta Clean Architecture
// Las dependencias fluyen hacia adentro (hacia el dominio)

// Infrastructure Layer (implementaciones)
const userRepository = new PostgresUserRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();

// Application Layer (casos de uso)
const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordService,
  tokenService
);

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  passwordService,
  tokenService
);

const refreshTokenUseCase = new RefreshTokenUseCase(
  tokenService,
  userRepository
);

const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);

// User management use cases (admin only)
const createUserByAdminUseCase = new CreateUserByAdminUseCase(
  userRepository,
  passwordService
);

const listUsersUseCase = new ListUsersUseCase(userRepository);

const updateUserUseCase = new UpdateUserUseCase(userRepository);

const deleteUserUseCase = new DeleteUserUseCase(userRepository);

// Presentation Layer (controllers)
const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  refreshTokenUseCase,
  getUserProfileUseCase
);

const userController = new UserController(
  createUserByAdminUseCase,
  listUsersUseCase,
  updateUserUseCase,
  deleteUserUseCase,
  getUserProfileUseCase
);

export const container = {
  authController,
  userController,
  userRepository,
  passwordService,
  tokenService
};
