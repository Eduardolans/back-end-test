import { UserRepository } from '../repositories/UserRepository';
import {
  PaginationOptionsData,
  PaginatedResultData,
} from '../repositories/types';
import { UserBusiness } from './types';
import { NotFoundError } from './errors';
import { EntityMapper } from './EntityMapper';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  public async getAllUsers(): Promise<UserBusiness[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => EntityMapper.toUserBusiness(user));
  }

  public async getAllUsersPaginated(
    options: PaginationOptionsData
  ): Promise<PaginatedResultData<UserBusiness>> {
    const result = await this.userRepository.findAllPaginated(options);
    return {
      ...result,
      data: result.data.map((user) => EntityMapper.toUserBusiness(user)),
    };
  }

  public async getUserById(id: string): Promise<UserBusiness> {
    const user = await this.userRepository.findById(id);
    if (user === null) {
      throw new NotFoundError('User', id);
    }
    return EntityMapper.toUserBusiness(user);
  }
}
