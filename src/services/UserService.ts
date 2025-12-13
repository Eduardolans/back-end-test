import { UserRepository } from '../repositories/UserRepository';
import { PaginationOptions, PaginatedResult } from '../models/types';
import { User } from '../models/dataModels';
import { NotFoundError } from '../errors/DomainErrors';

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

  public async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (user === null) {
      throw new NotFoundError('User', id);
    }
    return user;
  }
}
