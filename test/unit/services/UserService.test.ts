import { expect } from 'chai';
import { UserService } from '../../../src/services/UserService';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { VehicleRepository } from '../../../src/repositories/VehicleRepository';
import { LicenseType, VehicleType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../src/services/errors';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let vehicleRepository: VehicleRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    vehicleRepository = new VehicleRepository();
    service = new UserService(userRepository, vehicleRepository);
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          nombre: 'User One',
          email: 'user1@example.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          nombre: 'User Two',
          email: 'user2@example.com',
          tipoPermiso: LicenseType.A,
          permisoValidoHasta: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      userRepository.findAll = () => Promise.resolve(mockUsers);

      const result = await service.getAllUsers();

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0].nombre).to.equal('User One');
    });
  });

  describe('getAllUsersPaginated', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          nombre: 'User One',
          email: 'user1@example.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPaginatedResult = {
        data: mockUsers,
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
      };

      userRepository.findAllPaginated = () =>
        Promise.resolve(mockPaginatedResult);

      const result = await service.getAllUsersPaginated({ page: 1, limit: 10 });

      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(1);
      expect(result.total).to.equal(15);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(10);
      expect(result.totalPages).to.equal(2);
    });
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: 'user-123',
        nombre: 'Test User',
        email: 'test@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.findById = () => Promise.resolve(mockUser);

      const result = await service.getUserById('user-123');

      expect(result).to.not.be.null;
      expect(result.nombre).to.equal('Test User');
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findById = () => Promise.resolve(null);

      try {
        await service.getUserById('nonexistent-id');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as NotFoundError).message).to.include('User');
      }
    });
  });

  describe('revokePermit', () => {
    it('should revoke permit when user has no vehicles', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        nombre: 'Test User',
        email: 'test@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date('2026-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.findById = () => Promise.resolve(mockUser);
      vehicleRepository.findByOwner = () => Promise.resolve([]);
      userRepository.updatePermitExpiration = () =>
        Promise.resolve({
          ...mockUser,
          permisoValidoHasta: new Date('2000-01-01'),
        });

      await service.revokePermit(userId);
    });

    it('should throw ValidationError when user has vehicles', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        nombre: 'Test User',
        email: 'test@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date('2026-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockVehicle = {
        id: 'vehicle-1',
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'ABC123',
        tipo: VehicleType.coche,
        propietarioId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        propietario: mockUser,
      };

      userRepository.findById = () => Promise.resolve(mockUser);
      vehicleRepository.findByOwner = () => Promise.resolve([mockVehicle]);

      try {
        await service.revokePermit(userId);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect((error as ValidationError).message).to.include('vehicles');
      }
    });

    it('should throw NotFoundError when user does not exist', async () => {
      userRepository.findById = () => Promise.resolve(null);

      try {
        await service.revokePermit('nonexistent-id');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as NotFoundError).message).to.include('User');
      }
    });
  });
});
