import { expect } from 'chai';
import { UserRepository } from '../../src/repositories/UserRepository';
import { getPrismaClient } from '../../src/repositories/prisma';
import { User, LicenseType } from '@prisma/client';

async function createTestUser(data: {
  nombre: string;
  email: string;
  tipoPermiso: LicenseType;
  permisoValidoHasta: Date;
}): Promise<User> {
  const prisma = getPrismaClient();
  return await prisma.user.create({ data });
}

describe('UserRepository Integration Tests', () => {
  let repository: UserRepository;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.ownershipHistory.deleteMany();
    await prisma.authorizedDriver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    repository = new UserRepository();
  });

  describe('findById', () => {
    it('should return user when exists', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const createdUser = await createTestUser({
        nombre: 'Juan Pérez',
        email: 'juan@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      const result = await repository.findById(createdUser.id);

      expect(result).to.not.be.null;
      expect(result?.id).to.equal(createdUser.id);
      expect(result?.nombre).to.equal('Juan Pérez');
      expect(result?.email).to.equal('juan@test.com');
    });

    it('should return null when user does not exist', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).to.be.null;
    });
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      await createTestUser({
        nombre: 'María López',
        email: 'maria@test.com',
        tipoPermiso: LicenseType.A,
        permisoValidoHasta: futureDate,
      });

      const result = await repository.findByEmail('maria@test.com');

      expect(result).to.not.be.null;
      expect(result?.email).to.equal('maria@test.com');
      expect(result?.nombre).to.equal('María López');
    });

    it('should return null when email does not exist', async () => {
      const result = await repository.findByEmail('nonexistent@test.com');
      expect(result).to.be.null;
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      await createTestUser({
        nombre: 'User 1',
        email: 'user1@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      await createTestUser({
        nombre: 'User 2',
        email: 'user2@test.com',
        tipoPermiso: LicenseType.A,
        permisoValidoHasta: futureDate,
      });

      const result = await repository.findAll();

      expect(result).to.have.lengthOf(2);
      expect(result[0].nombre).to.equal('User 1');
      expect(result[1].nombre).to.equal('User 2');
    });

    it('should return empty array when no users', async () => {
      const result = await repository.findAll();
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated results', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      for (let i = 1; i <= 15; i++) {
        await createTestUser({
          nombre: `User ${i}`,
          email: `user${i}@test.com`,
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        });
      }

      const result = await repository.findAllPaginated({
        page: 1,
        limit: 10,
      });

      expect(result.data).to.have.lengthOf(10);
      expect(result.total).to.equal(15);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(10);
      expect(result.totalPages).to.equal(2);
    });

    it('should return second page correctly', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      for (let i = 1; i <= 15; i++) {
        await createTestUser({
          nombre: `User ${i}`,
          email: `user${i}@test.com`,
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        });
      }

      const result = await repository.findAllPaginated({
        page: 2,
        limit: 10,
      });

      expect(result.data).to.have.lengthOf(5);
      expect(result.total).to.equal(15);
      expect(result.page).to.equal(2);
    });
  });
});
