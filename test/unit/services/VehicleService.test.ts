import { expect } from 'chai';
import { VehicleService } from '../../../src/services/VehicleService';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { VehicleRepository } from '../../../src/repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../../../src/repositories/AuthorizedDriverRepository';
import { OwnershipHistoryRepository } from '../../../src/repositories/OwnershipHistoryRepository';
import { LicenseValidator } from '../../../src/services/LicenseValidator';
import { VehicleValidator } from '../../../src/services/VehicleValidator';
import { LicenseType, VehicleType } from '@prisma/client';

describe('VehicleService', () => {
  let service: VehicleService;
  let userRepository: UserRepository;
  let vehicleRepository: VehicleRepository;
  let authorizedDriverRepository: AuthorizedDriverRepository;
  let ownershipHistoryRepository: OwnershipHistoryRepository;
  let licenseValidator: LicenseValidator;
  let vehicleValidator: VehicleValidator;

  beforeEach(() => {
    userRepository = new UserRepository();
    vehicleRepository = new VehicleRepository();
    authorizedDriverRepository = new AuthorizedDriverRepository();
    ownershipHistoryRepository = new OwnershipHistoryRepository();
    licenseValidator = new LicenseValidator();
    vehicleValidator = new VehicleValidator(
      userRepository,
      vehicleRepository,
      licenseValidator
    );
    service = new VehicleService(
      vehicleRepository,
      authorizedDriverRepository,
      ownershipHistoryRepository,
      vehicleValidator
    );
  });

  describe('registerVehicle', () => {
    it('should register a vehicle when owner has valid license', async () => {
      const ownerId = 'user-123';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockOwner = {
        id: ownerId,
        nombre: 'Test User',
        email: 'test@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.findById = () => Promise.resolve(mockOwner);

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
          propietario: mockOwner,
        });

      ownershipHistoryRepository.create = () =>
        Promise.resolve({
          id: 'history-123',
          vehicleId: 'vehicle-123',
          userId: ownerId,
          fechaInicio: new Date(),
          fechaFin: null,
          createdAt: new Date(),
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
      expect(result.propietario).to.exist;
      expect(result.propietario.id).to.equal(ownerId);
      expect(result).to.not.have.property('propietarioId');
    });
  });

  describe('getAllVehicles', () => {
    it('should return an array of vehicles', async () => {
      const mockOwner1 = {
        id: 'user-1',
        nombre: 'Owner 1',
        email: 'owner1@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOwner2 = {
        id: 'user-2',
        nombre: 'Owner 2',
        email: 'owner2@example.com',
        tipoPermiso: LicenseType.A,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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
          propietario: mockOwner1,
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
          propietario: mockOwner2,
        },
      ];

      vehicleRepository.findAll = () => Promise.resolve(mockVehicles);

      const result = await service.getAllVehicles();

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0].marca).to.equal('Toyota');
      expect(result[0].propietario).to.exist;
      expect(result[0].propietario.id).to.equal('user-1');
      expect(result[0]).to.not.have.property('propietarioId');
    });
  });

  describe('addAuthorizedDriver', () => {
    it('should add authorized driver when user has valid license', async () => {
      const vehicleId = 'vehicle-123';
      const userId = 'user-456';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      vehicleRepository.findById = () =>
        Promise.resolve({
          id: vehicleId,
          marca: 'Toyota',
          modelo: 'Corolla',
          matricula: '1234ABC',
          tipo: VehicleType.coche,
          propietarioId: 'owner-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          propietario: {
            id: 'owner-id',
            nombre: 'Vehicle Owner',
            email: 'owner@example.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: futureDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      const mockDriver = {
        id: userId,
        nombre: 'Test Driver',
        email: 'driver@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.findById = () => Promise.resolve(mockDriver);

      authorizedDriverRepository.addDriver = () =>
        Promise.resolve({
          id: 'auth-123',
          vehicleId,
          userId,
          createdAt: new Date(),
          user: mockDriver,
        });

      const result = await service.addAuthorizedDriver(vehicleId, userId);

      expect(result.vehicleId).to.equal(vehicleId);
      expect(result.driver).to.exist;
      expect(result.driver.id).to.equal(userId);
      expect(result).to.not.have.property('userId');
    });
  });
});
