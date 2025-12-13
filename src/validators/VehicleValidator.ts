import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { LicenseValidator } from '../services/LicenseValidator';
import {
  NotFoundError,
  ValidationError,
  DuplicityError,
} from '../errors/DomainErrors';
import { Vehicle, VehicleType } from '../models/dataModels';

export class VehicleValidator {
  constructor(
    private userRepository: UserRepository,
    private vehicleRepository: VehicleRepository,
    private licenseValidator: LicenseValidator
  ) {}

  public async validateVehicleExists(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (vehicle === null) {
      throw new NotFoundError('Vehicle', vehicleId);
    }
    return vehicle;
  }

  public async validateOwnerExists(ownerId: string): Promise<void> {
    const owner = await this.userRepository.findById(ownerId);
    if (owner === null) {
      throw new NotFoundError('User', ownerId);
    }
  }

  public validateDifferentOwner(
    currentOwnerId: string,
    newOwnerId: string
  ): void {
    if (currentOwnerId === newOwnerId) {
      throw new ValidationError(
        'New owner must be different from current owner'
      );
    }
  }

  public async validateMatriculaUnique(matricula: string): Promise<void> {
    const existing = await this.vehicleRepository.findByMatricula(matricula);
    if (existing) {
      throw new DuplicityError('Vehicle', 'matricula');
    }
  }

  public async validateOwnerLicense(
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
      throw new ValidationError(
        'Owner does not have valid license for this vehicle type'
      );
    }
  }
}
