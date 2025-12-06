import { expect } from 'chai';
import { LicenseValidator } from '../../../src/services/LicenseValidator';
import { LicenseType, VehicleType } from '../../../src/models/types';

describe('LicenseValidator', () => {
  let validator: LicenseValidator;

  beforeEach(() => {
    validator = new LicenseValidator();
  });

  describe('isLicenseValidForVehicle', () => {
    it('should return true when license type B matches vehicle type coche', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validator.isLicenseValidForVehicle(
        LicenseType.B,
        futureDate,
        VehicleType.coche
      );

      expect(result).to.be.true;
    });

    it('should return false when license is expired', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const result = validator.isLicenseValidForVehicle(
        LicenseType.B,
        pastDate,
        VehicleType.coche
      );

      expect(result).to.be.false;
    });

    it('should return false when license type does not match vehicle type', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validator.isLicenseValidForVehicle(
        LicenseType.A,
        futureDate,
        VehicleType.coche
      );

      expect(result).to.be.false;
    });

    it('should return true when license type A matches vehicle type moto', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validator.isLicenseValidForVehicle(
        LicenseType.A,
        futureDate,
        VehicleType.moto
      );

      expect(result).to.be.true;
    });

    it('should return true when license type C matches vehicle type camion', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validator.isLicenseValidForVehicle(
        LicenseType.C,
        futureDate,
        VehicleType.camion
      );

      expect(result).to.be.true;
    });
  });
});
