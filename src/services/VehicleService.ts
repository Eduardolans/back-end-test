import { AuthorizedDriver, Vehicle } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../repositories/AuthorizedDriverRepository';
import { LicenseValidator } from './LicenseValidator';
import { CreateVehicleDTO, VehicleType } from '../models/types';
import { AppError } from '../middleware/errorHandler';

export class VehicleService {
  constructor(
    private userRepository: UserRepository,
    private vehicleRepository: VehicleRepository,
    private authorizedDriverRepository: AuthorizedDriverRepository,
    private licenseValidator: LicenseValidator
  ) {}

  public async registerVehicle(data: CreateVehicleDTO): Promise<Vehicle> {
    await this.validateOwnerExists(data.propietario_id);
    await this.validateMatriculaUnique(data.matricula);
    await this.validateOwnerLicense(data.propietario_id, data.tipo);

    return await this.vehicleRepository.create(data);
  }

  public async transferOwnership(
    vehicleId: string,
    newOwnerId: string
  ): Promise<Vehicle> {
    const vehicle = await this.validateVehicleExists(vehicleId);
    await this.validateOwnerExists(newOwnerId);
    this.validateDifferentOwner(vehicle.propietarioId, newOwnerId);
    await this.validateOwnerLicense(newOwnerId, vehicle.tipo);

    return await this.vehicleRepository.updateOwner(vehicleId, newOwnerId);
  }

  public async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    await this.validateOwnerExists(ownerId);
    return await this.vehicleRepository.findByOwner(ownerId);
  }

  public async getAllVehicles(): Promise<Vehicle[]> {
    return await this.vehicleRepository.findAll();
  }

  public async addAuthorizedDriver(
    vehicleId: string,
    userId: string
  ): Promise<AuthorizedDriver> {
    const vehicle = await this.validateVehicleExists(vehicleId);
    await this.validateOwnerExists(userId);
    await this.validateOwnerLicense(userId, vehicle.tipo);

    return await this.authorizedDriverRepository.addDriver(vehicleId, userId);
  }

  private async validateVehicleExists(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (vehicle === null) {
      throw new AppError(404, 'Vehicle not found');
    }
    return vehicle;
  }

  private async validateOwnerExists(ownerId: string): Promise<void> {
    const owner = await this.userRepository.findById(ownerId);
    if (owner === null) {
      throw new AppError(404, 'Owner not found');
    }
  }

  private validateDifferentOwner(
    currentOwnerId: string,
    newOwnerId: string
  ): void {
    if (currentOwnerId === newOwnerId) {
      throw new AppError(400, 'New owner must be different from current owner');
    }
  }

  private async validateMatriculaUnique(matricula: string): Promise<void> {
    const existing = await this.vehicleRepository.findByMatricula(matricula);
    if (existing) {
      throw new AppError(409, 'License plate already exists');
    }
  }

  private async validateOwnerLicense(
    ownerId: string,
    vehicleType: VehicleType
  ): Promise<void> {
    const owner = await this.userRepository.findById(ownerId);
    if (!owner) {
      return;
    }

    const isValid = this.licenseValidator.isLicenseValidForVehicle(
      owner.tipoPermiso,
      owner.permisoValidoHasta,
      vehicleType
    );

    if (!isValid) {
      throw new AppError(400, 'Owner does not have valid license');
    }
  }
}
