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

  describe('getAuthorizedDrivers', () => {
    it('should return list of authorized drivers for a vehicle', async () => {
      const vehicleId = 'vehicle-123';

      const mockDriver1 = {
        id: 'driver-1',
        nombre: 'Driver One',
        email: 'driver1@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDriver2 = {
        id: 'driver-2',
        nombre: 'Driver Two',
        email: 'driver2@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthorizedDrivers = [
        {
          id: 'auth-1',
          vehicleId,
          userId: 'driver-1',
          createdAt: new Date(),
          user: mockDriver1,
        },
        {
          id: 'auth-2',
          vehicleId,
          userId: 'driver-2',
          createdAt: new Date(),
          user: mockDriver2,
        },
      ];

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
            nombre: 'Owner',
            email: 'owner@example.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      authorizedDriverRepository.findByVehicle = () =>
        Promise.resolve(mockAuthorizedDrivers);

      const result = await service.getAuthorizedDrivers(vehicleId);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0].driver).to.exist;
      expect(result[0].driver.id).to.equal('driver-1');
      expect(result[0].driver.nombre).to.equal('Driver One');
      expect(result[0]).to.not.have.property('userId');
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership when validations pass', async () => {
      const vehicleId = 'vehicle-123';
      const newOwnerId = 'user-456';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockVehicle = {
        id: vehicleId,
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: '1234ABC',
        tipo: VehicleType.coche,
        propietarioId: 'old-owner-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        propietario: {
          id: 'old-owner-id',
          nombre: 'Old Owner',
          email: 'old@example.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockNewOwner = {
        id: newOwnerId,
        nombre: 'New Owner',
        email: 'new@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vehicleRepository.findById = () => Promise.resolve(mockVehicle);
      userRepository.findById = () => Promise.resolve(mockNewOwner);
      ownershipHistoryRepository.closeCurrentOwnership = () =>
        Promise.resolve();
      vehicleRepository.updateOwner = () =>
        Promise.resolve({ ...mockVehicle, propietario: mockNewOwner });
      ownershipHistoryRepository.create = () =>
        Promise.resolve({
          id: 'history-123',
          vehicleId,
          userId: newOwnerId,
          fechaInicio: new Date(),
          fechaFin: null,
          createdAt: new Date(),
        });

      const result = await service.transferOwnership(vehicleId, newOwnerId);

      expect(result.id).to.equal(vehicleId);
      expect(result.propietario.id).to.equal(newOwnerId);
    });
  });

  describe('getVehiclesByOwner', () => {
    it('should return vehicles for a specific owner', async () => {
      const ownerId = 'owner-123';
      const mockOwner = {
        id: ownerId,
        nombre: 'Vehicle Owner',
        email: 'owner@example.com',
        tipoPermiso: LicenseType.B,
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
          propietarioId: ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          propietario: mockOwner,
        },
      ];

      userRepository.findById = () => Promise.resolve(mockOwner);
      vehicleRepository.findByOwner = () => Promise.resolve(mockVehicles);

      const result = await service.getVehiclesByOwner(ownerId);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0].marca).to.equal('Toyota');
      expect(result[0].propietario.id).to.equal(ownerId);
    });
  });

  describe('getAllVehiclesPaginated', () => {
    it('should return paginated vehicles', async () => {
      const mockOwner = {
        id: 'owner-1',
        nombre: 'Owner',
        email: 'owner@example.com',
        tipoPermiso: LicenseType.B,
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
          propietarioId: 'owner-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          propietario: mockOwner,
        },
      ];

      const mockPaginatedResult = {
        data: mockVehicles,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      };

      vehicleRepository.findAllPaginated = () =>
        Promise.resolve(mockPaginatedResult);

      const result = await service.getAllVehiclesPaginated({
        page: 1,
        limit: 10,
      });

      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(1);
      expect(result.total).to.equal(25);
      expect(result.page).to.equal(1);
      expect(result.totalPages).to.equal(3);
    });
  });

  describe('removeAuthorizedDriver', () => {
    it('should remove authorized driver', async () => {
      const vehicleId = 'vehicle-123';
      const driverId = 'driver-456';

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
            nombre: 'Owner',
            email: 'owner@example.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      authorizedDriverRepository.removeDriver = () =>
        Promise.resolve({ count: 1 });

      await service.removeAuthorizedDriver(vehicleId, driverId);
    });
  });

  describe('getOwnershipHistory', () => {
    it('should return ownership history for a vehicle', async () => {
      const vehicleId = 'vehicle-123';

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
            nombre: 'Owner',
            email: 'owner@example.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      const mockHistory = [
        {
          id: 'history-1',
          vehicleId,
          userId: 'owner-1',
          fechaInicio: new Date('2023-01-01'),
          fechaFin: new Date('2024-01-01'),
          createdAt: new Date(),
          user: {
            id: 'owner-1',
            nombre: 'First Owner',
            email: 'first@example.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      ownershipHistoryRepository.findByVehicle = () =>
        Promise.resolve(mockHistory);

      const result = await service.getOwnershipHistory(vehicleId);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0].owner).to.exist;
      expect(result[0].owner.nombre).to.equal('First Owner');
    });
  });
});
