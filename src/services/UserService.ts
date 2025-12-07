import { User } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository';
import { PaginationOptions, PaginatedResult } from '../models/types';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  public async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  public async getAllUsersPaginated(
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    return await this.userRepository.findAllPaginated(options);
  }

  public async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }
}
