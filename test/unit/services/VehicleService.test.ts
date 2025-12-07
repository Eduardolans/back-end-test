import { expect } from 'chai';
import { VehicleService } from '../../../src/services/VehicleService';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { VehicleRepository } from '../../../src/repositories/VehicleRepository';
import { LicenseValidator } from '../../../src/services/LicenseValidator';
import { LicenseType, VehicleType } from '../../../src/models/types';

describe('VehicleService', () => {
  let service: VehicleService;
  let userRepository: UserRepository;
  let vehicleRepository: VehicleRepository;
  let licenseValidator: LicenseValidator;

  beforeEach(() => {
    userRepository = new UserRepository();
    vehicleRepository = new VehicleRepository();
    licenseValidator = new LicenseValidator();
    service = new VehicleService(
      userRepository,
      vehicleRepository,
      licenseValidator
    );
  });

  describe('registerVehicle', () => {
    it('should register a vehicle when owner has valid license', async () => {
      const ownerId = 'user-123';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      userRepository.findById = () =>
        Promise.resolve({
          id: ownerId,
          nombre: 'Test User',
          email: 'test@example.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      vehicleRepository.findByMatricula = () => Promise.resolve(null);

      vehicleRepository.create = (data) =>
        Promise.resolve({
          id: 'vehicle-123',
          marca: data.marca,
          modelo: data.modelo,
          matricula: data.matricula,
          tipo: data.tipo,
          propietarioId: data.propietario_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.registerVehicle({
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: '1234ABC',
        tipo: VehicleType.coche,
        propietario_id: ownerId,
      });

      expect(result.marca).to.equal('Toyota');
      expect(result.matricula).to.equal('1234ABC');
    });
  });

  describe('getAllVehicles', () => {
    it('should return an array of vehicles', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-1',
          marca: 'Toyota',
          modelo: 'Corolla',
          matricula: '1234ABC',
          tipo: VehicleType.coche,
          propietarioId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'vehicle-2',
          marca: 'Honda',
          modelo: 'CBR',
          matricula: '5678XYZ',
          tipo: VehicleType.moto,
          propietarioId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vehicleRepository.findAll = () => Promise.resolve(mockVehicles);

      const result = await service.getAllVehicles();

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0].marca).to.equal('Toyota');
    });
  });
});
