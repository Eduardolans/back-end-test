import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import {
  PaginationOptionsData,
  PaginatedResultData,
} from '../repositories/types';
import { UserBusiness } from './types';
import { NotFoundError, ValidationError } from './errors';
import { EntityMapper } from './EntityMapper';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private vehicleRepository: VehicleRepository
  ) {}

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

  public async revokePermit(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (user === null) {
      throw new NotFoundError('User', userId);
    }

    const vehicles = await this.vehicleRepository.findByOwner(userId);
    if (vehicles.length > 0) {
      throw new ValidationError(
        'Cannot revoke permit: user has vehicles registered'
      );
    }

    await this.userRepository.updatePermitExpiration(
      userId,
      new Date('2000-01-01')
    );
  }
}
