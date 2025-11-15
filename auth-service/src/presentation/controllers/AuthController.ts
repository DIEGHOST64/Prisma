// filepath: src/presentation/controllers/AuthController.ts
// 🌐 PRESENTATION LAYER - HTTP Controller
// Este controlador SÍ conoce Express (pero el dominio NO lo sabe)

import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/usecases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../application/usecases/RefreshTokenUseCase';
import { GetUserProfileUseCase } from '../../application/usecases/GetUserProfileUseCase';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.registerUserUseCase.execute(req.body);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.loginUserUseCase.execute(req.body);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      const result = await this.refreshTokenUseCase.execute({ refreshToken });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // El UUID viene del middleware de autenticación
      const uuid = (req as any).user?.uuid;
      
      if (!uuid) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const result = await this.getUserProfileUseCase.execute({ uuid });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'User not found'
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar revocación de refresh token
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
}
