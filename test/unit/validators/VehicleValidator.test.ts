import { expect } from 'chai';
import { VehicleValidator } from '../../../src/validators/VehicleValidator';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { VehicleRepository } from '../../../src/repositories/VehicleRepository';
import { LicenseValidator } from '../../../src/services/LicenseValidator';
import {
  NotFoundError,
  DuplicityError,
} from '../../../src/errors/DomainErrors';
import { LicenseType, VehicleType } from '../../../src/models/dataModels';

describe('VehicleValidator', () => {
  let validator: VehicleValidator;
  let userRepository: UserRepository;
  let vehicleRepository: VehicleRepository;
  let licenseValidator: LicenseValidator;

  beforeEach(() => {
    userRepository = new UserRepository();
    vehicleRepository = new VehicleRepository();
    licenseValidator = new LicenseValidator();
    validator = new VehicleValidator(
      userRepository,
      vehicleRepository,
      licenseValidator
    );
  });

  describe('validateOwnerExists', () => {
    it('should throw NotFoundError when owner does not exist', async () => {
      userRepository.findById = () => Promise.resolve(null);

      try {
        await validator.validateOwnerExists('nonexistent-id');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as NotFoundError).message).to.include('User');
      }
    });

    it('should not throw when owner exists', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      userRepository.findById = () =>
        Promise.resolve({
          id: 'user-123',
          nombre: 'Test User',
          email: 'test@example.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await validator.validateOwnerExists('user-123');
    });
  });

  describe('validateMatriculaUnique', () => {
    it('should throw DuplicityError when matricula already exists', async () => {
      vehicleRepository.findByMatricula = () =>
        Promise.resolve({
          id: 'vehicle-123',
          marca: 'Toyota',
          modelo: 'Corolla',
          matricula: '1234ABC',
          tipo: VehicleType.coche,
          propietarioId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      try {
        await validator.validateMatriculaUnique('1234ABC');
        expect.fail('Should have thrown DuplicityError');
      } catch (error) {
        expect(error).to.be.instanceOf(DuplicityError);
        expect((error as DuplicityError).message).to.include('matricula');
      }
    });

    it('should not throw when matricula is unique', async () => {
      vehicleRepository.findByMatricula = () => Promise.resolve(null);

      await validator.validateMatriculaUnique('NEW123');
    });
  });

  describe('validateVehicleExists', () => {
    it('should throw NotFoundError when vehicle does not exist', async () => {
      vehicleRepository.findById = () => Promise.resolve(null);

      try {
        await validator.validateVehicleExists('nonexistent-id');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as NotFoundError).message).to.include('Vehicle');
      }
    });

    it('should return vehicle when it exists', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: '1234ABC',
        tipo: VehicleType.coche,
        propietarioId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vehicleRepository.findById = () => Promise.resolve(mockVehicle);

      const result = await validator.validateVehicleExists('vehicle-123');
      expect(result).to.equal(mockVehicle);
    });
  });
});
