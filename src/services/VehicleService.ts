import { AuthorizedDriver, OwnershipHistory, Vehicle } from '@prisma/client';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../repositories/AuthorizedDriverRepository';
import { OwnershipHistoryRepository } from '../repositories/OwnershipHistoryRepository';
import { VehicleValidator } from '../validators/VehicleValidator';
import {
  CreateVehicleDTO,
  PaginationOptions,
  PaginatedResult,
} from '../models/types';

export class VehicleService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private authorizedDriverRepository: AuthorizedDriverRepository,
    private ownershipHistoryRepository: OwnershipHistoryRepository,
    private vehicleValidator: VehicleValidator
  ) {}

  public async registerVehicle(data: CreateVehicleDTO): Promise<Vehicle> {
    await this.vehicleValidator.validateOwnerExists(data.propietario_id);
    await this.vehicleValidator.validateMatriculaUnique(data.matricula);
    await this.vehicleValidator.validateOwnerLicense(
      data.propietario_id,
      data.tipo
    );

    const vehicle = await this.vehicleRepository.create(data);
    await this.ownershipHistoryRepository.create(
      vehicle.id,
      data.propietario_id
    );

    return vehicle;
  }

  public async transferOwnership(
    vehicleId: string,
    newOwnerId: string
  ): Promise<Vehicle> {
    const vehicle = await this.vehicleValidator.validateVehicleExists(
      vehicleId
    );
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

    const updatedVehicle = await this.vehicleRepository.updateOwner(
      vehicleId,
      newOwnerId
    );

    await this.ownershipHistoryRepository.create(vehicleId, newOwnerId);

    return updatedVehicle;
  }

  public async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    await this.vehicleValidator.validateOwnerExists(ownerId);
    return await this.vehicleRepository.findByOwner(ownerId);
  }

  public async getAllVehicles(): Promise<Vehicle[]> {
    return await this.vehicleRepository.findAll();
  }

  public async getAllVehiclesPaginated(
    options: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>> {
    return await this.vehicleRepository.findAllPaginated(options);
  }

  public async addAuthorizedDriver(
    vehicleId: string,
    userId: string
  ): Promise<AuthorizedDriver> {
    const vehicle = await this.vehicleValidator.validateVehicleExists(
      vehicleId
    );
    await this.vehicleValidator.validateOwnerExists(userId);
    await this.vehicleValidator.validateOwnerLicense(userId, vehicle.tipo);

    return await this.authorizedDriverRepository.addDriver(vehicleId, userId);
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
  ): Promise<OwnershipHistory[]> {
    await this.vehicleValidator.validateVehicleExists(vehicleId);
    return await this.ownershipHistoryRepository.findByVehicle(vehicleId);
  }
}
