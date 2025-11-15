// filepath: src/presentation/controllers/UserController.ts
// 🌐 PRESENTATION LAYER - User Management Controller (Admin only)

import { Request, Response } from 'express';
import { CreateUserByAdminUseCase } from '../../application/usecases/CreateUserByAdminUseCase';
import { ListUsersUseCase } from '../../application/usecases/ListUsersUseCase';
import { UpdateUserUseCase } from '../../application/usecases/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../application/usecases/DeleteUserUseCase';
import { GetUserProfileUseCase } from '../../application/usecases/GetUserProfileUseCase';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserByAdminUseCase,
    private listUsersUseCase: ListUsersUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase
  ) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createUserUseCase.execute(req.body);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      });
    }
  }

  async listUsers(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.listUsersUseCase.execute();
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users'
      });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
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

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const result = await this.updateUserUseCase.execute({
        uuid,
        ...req.body
      });
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const adminUuid = (req as any).user?.uuid;
      
      const result = await this.deleteUserUseCase.execute({
        uuid,
        adminUuid
      });
      
      res.status(200).json({
        success: true,
        data: { deleted: result },
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      });
    }
  }
}
