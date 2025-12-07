import { User } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  public async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  public async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }
}
