import { LicenseType, VehicleType } from '@prisma/client';

export class LicenseValidator {
  private readonly licenseVehicleMap: Map<LicenseType, VehicleType> = new Map([
    [LicenseType.A, VehicleType.moto],
    [LicenseType.B, VehicleType.coche],
    [LicenseType.C, VehicleType.camion],
  ]);

  public isLicenseValidForVehicle(
    licenseType: LicenseType,
    validUntil: Date,
    vehicleType: VehicleType
  ): boolean {
    return (
      this.isLicenseTypeMatching(licenseType, vehicleType) &&
      this.isLicenseNotExpired(validUntil)
    );
  }

  private isLicenseTypeMatching(
    licenseType: LicenseType,
    vehicleType: VehicleType
  ): boolean {
    return this.licenseVehicleMap.get(licenseType) === vehicleType;
  }

  private isLicenseNotExpired(validUntil: Date): boolean {
    return validUntil > new Date();
  }
}
