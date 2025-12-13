import { VehicleRepository } from '../repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../repositories/AuthorizedDriverRepository';
import { OwnershipHistoryRepository } from '../repositories/OwnershipHistoryRepository';
import { VehicleValidator } from '../validators/VehicleValidator';
import {
  CreateVehicleDTO,
  PaginationOptions,
  PaginatedResult,
} from '../models/types';
import {
  VehicleBusiness,
  AuthorizedDriverBusiness,
  OwnershipHistoryBusiness,
} from '../models/businessModels';
import { EntityMapper } from '../mappers/EntityMapper';

export class VehicleService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private authorizedDriverRepository: AuthorizedDriverRepository,
    private ownershipHistoryRepository: OwnershipHistoryRepository,
    private vehicleValidator: VehicleValidator
  ) {}

  public async registerVehicle(
    data: CreateVehicleDTO
  ): Promise<VehicleBusiness> {
    await this.vehicleValidator.validateOwnerExists(data.propietario_id);
    await this.vehicleValidator.validateMatriculaUnique(data.matricula);
    await this.vehicleValidator.validateOwnerLicense(
      data.propietario_id,
      data.tipo
    );

    const vehicleWithOwner = await this.vehicleRepository.createWithOwner(data);
    await this.ownershipHistoryRepository.create(
      vehicleWithOwner.id,
      data.propietario_id
    );

    return EntityMapper.toVehicleBusiness(
      vehicleWithOwner,
      vehicleWithOwner.propietario
    );
  }

  public async transferOwnership(
    vehicleId: string,
    newOwnerId: string
  ): Promise<VehicleBusiness> {
    const vehicle =
      await this.vehicleValidator.validateVehicleExists(vehicleId);
    await this.vehicleValidator.validateOwnerExists(newOwnerId);
    this.vehicleValidator.validateDifferentOwner(
      vehicle.propietarioId,
      newOwnerId
    );
    await this.vehicleValidator.validateOwnerLicense(newOwnerId, vehicle.tipo);

    await this.ownershipHistoryRepository.closeCurrentOwnership(
      vehicleId,
      vehicle.propietarioId
    );

    const updatedVehicle = await this.vehicleRepository.updateOwnerAndGet(
      vehicleId,
      newOwnerId
    );

    await this.ownershipHistoryRepository.create(vehicleId, newOwnerId);

    return EntityMapper.toVehicleBusiness(
      updatedVehicle,
      updatedVehicle.propietario
    );
  }

  public async getVehiclesByOwner(ownerId: string): Promise<VehicleBusiness[]> {
    await this.vehicleValidator.validateOwnerExists(ownerId);
    const vehicles = await this.vehicleRepository.findByOwnerWithOwner(ownerId);
    return vehicles.map((v) =>
      EntityMapper.toVehicleBusiness(v, v.propietario)
    );
  }

  public async getAllVehicles(): Promise<VehicleBusiness[]> {
    const vehicles = await this.vehicleRepository.findAllWithOwner();
    return vehicles.map((v) =>
      EntityMapper.toVehicleBusiness(v, v.propietario)
    );
  }

  public async getAllVehiclesPaginated(
    options: PaginationOptions
  ): Promise<PaginatedResult<VehicleBusiness>> {
    const result =
      await this.vehicleRepository.findAllPaginatedWithOwner(options);
    return {
      ...result,
      data: result.data.map((v) =>
        EntityMapper.toVehicleBusiness(v, v.propietario)
      ),
    };
  }

  public async addAuthorizedDriver(
    vehicleId: string,
    userId: string
  ): Promise<AuthorizedDriverBusiness> {
    const vehicle =
      await this.vehicleValidator.validateVehicleExists(vehicleId);
    await this.vehicleValidator.validateOwnerExists(userId);
    await this.vehicleValidator.validateOwnerLicense(userId, vehicle.tipo);

    const authorizedDriver =
      await this.authorizedDriverRepository.addDriverWithUser(
        vehicleId,
        userId
      );

    return EntityMapper.toAuthorizedDriverBusiness(
      authorizedDriver,
      authorizedDriver.user
    );
  }

  public async removeAuthorizedDriver(
    vehicleId: string,
    userId: string
  ): Promise<void> {
    await this.vehicleValidator.validateVehicleExists(vehicleId);
    await this.authorizedDriverRepository.removeDriver(vehicleId, userId);
  }

  public async getOwnershipHistory(
    vehicleId: string
  ): Promise<OwnershipHistoryBusiness[]> {
    await this.vehicleValidator.validateVehicleExists(vehicleId);
    const history =
      await this.ownershipHistoryRepository.findByVehicleWithUser(vehicleId);
    return history.map((h) =>
      EntityMapper.toOwnershipHistoryBusiness(h, h.user)
    );
  }
}
