import { expect } from 'chai';
import { UserService } from '../../../src/services/UserService';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { LicenseType } from '../../../src/models/types';
import { NotFoundError } from '../../../src/errors/DomainErrors';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    service = new UserService(userRepository);
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
});
