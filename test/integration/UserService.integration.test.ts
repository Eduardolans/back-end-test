import { expect } from 'chai';
import { UserService } from '../../src/services/UserService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { getPrismaClient } from '../../src/utils/prisma';
import { LicenseType } from '../../src/models/dataModels';

describe('UserService Integration Tests', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    userRepository = new UserRepository();
    userService = new UserService(userRepository);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    await prisma.user.createMany({
      data: [
        {
          nombre: 'User One',
          email: 'user1@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        },
        {
          nombre: 'User Two',
          email: 'user2@integration.com',
          tipoPermiso: LicenseType.A,
          permisoValidoHasta: futureDate,
        },
      ],
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users from database', async () => {
      const result = await userService.getAllUsers();

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.have.property('nombre');
      expect(result[0]).to.have.property('email');
    });
  });

  describe('getUserById', () => {
    it('should retrieve specific user from database', async () => {
      const allUsers = await userService.getAllUsers();
      const firstUserId = allUsers[0].id;

      const result = await userService.getUserById(firstUserId);

      expect(result).to.not.be.null;
      expect(result?.id).to.equal(firstUserId);
      expect(result?.nombre).to.equal('User One');
    });
  });
});
