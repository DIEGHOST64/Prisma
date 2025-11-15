// filepath: src/application/usecases/GetUserProfileUseCase.ts
// 🔄 APPLICATION LAYER - Use Case

import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface GetUserProfileDTO {
  uuid: string;
}

export interface UserProfileResponseDTO {
  uuid: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export class GetUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: GetUserProfileDTO): Promise<UserProfileResponseDTO> {
    const user = await this.userRepository.findByUuid(dto.uuid);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }
}
