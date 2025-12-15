import '../../setup';
import { expect } from 'chai';
import sinon from 'sinon';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { PrismaClient, User, LicenseType } from '@prisma/client';

interface MockPrismaClient {
  user: {
    findUnique: sinon.SinonStub;
    findMany: sinon.SinonStub;
    count: sinon.SinonStub;
    update: sinon.SinonStub;
  };
}

describe('UserRepository Unit Tests', () => {
  let repository: UserRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: sinon.stub(),
        findMany: sinon.stub(),
        count: sinon.stub(),
        update: sinon.stub(),
      },
    };

    repository = new UserRepository(prismaMock as unknown as PrismaClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findById', () => {
    it('should call prisma.user.findUnique with correct id', async () => {
      const mockUser: User = {
        id: 'user-123',
        nombre: 'Test User',
        email: 'test@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const findUniqueStub = prismaMock.user.findUnique;
      findUniqueStub.resolves(mockUser);

      const result = await repository.findById('user-123');

      expect(result).to.deep.equal(mockUser);
      sinon.assert.calledOnceWithExactly(findUniqueStub, {
        where: { id: 'user-123' },
      });
    });

    it('should return null when user does not exist', async () => {
      const findUniqueStub = prismaMock.user.findUnique;
      findUniqueStub.resolves(null);

      const result = await repository.findById('non-existent-id');

      expect(result).to.be.null;
      sinon.assert.calledOnce(findUniqueStub);
    });
  });

  describe('findByEmail', () => {
    it('should call prisma.user.findUnique with correct email', async () => {
      const mockUser: User = {
        id: 'user-123',
        nombre: 'Test User',
        email: 'test@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const findUniqueStub = prismaMock.user.findUnique;
      findUniqueStub.resolves(mockUser);

      const result = await repository.findByEmail('test@test.com');

      expect(result).to.deep.equal(mockUser);
      sinon.assert.calledOnceWithExactly(findUniqueStub, {
        where: { email: 'test@test.com' },
      });
    });

    it('should return null when email not found', async () => {
      const findUniqueStub = prismaMock.user.findUnique;
      findUniqueStub.resolves(null);

      const result = await repository.findByEmail('notfound@test.com');

      expect(result).to.be.null;
    });
  });

  describe('findAll', () => {
    it('should call prisma.user.findMany and return users', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          nombre: 'User 1',
          email: 'user1@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          nombre: 'User 2',
          email: 'user2@test.com',
          tipoPermiso: LicenseType.A,
          permisoValidoHasta: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const findManyStub = prismaMock.user.findMany;
      findManyStub.resolves(mockUsers);

      const result = await repository.findAll();
      expect(result).to.deep.equal(mockUsers);
      sinon.assert.calledOnce(findManyStub);
    });

    it('should return empty array when no users', async () => {
      const findManyStub = prismaMock.user.findMany;
      findManyStub.resolves([]);

      const result = await repository.findAll();

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('findAllPaginated', () => {
    it('should call prisma methods with correct pagination', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          nombre: 'User 1',
          email: 'user1@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const findManyStub = prismaMock.user.findMany;
      const countStub = prismaMock.user.count;
      findManyStub.resolves(mockUsers);
      countStub.resolves(15);

      const result = await repository.findAllPaginated({ page: 1, limit: 10 });

      expect(result.data).to.deep.equal(mockUsers);
      expect(result.total).to.equal(15);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(10);
      expect(result.totalPages).to.equal(2);
      sinon.assert.calledOnceWithExactly(findManyStub, {
        skip: 0,
        take: 10,
      });
      sinon.assert.calledOnce(countStub);
    });
  });

  describe('updatePermitExpiration', () => {
    it('should call prisma.user.update with correct data', async () => {
      const userId = 'user-123';
      const newExpirationDate = new Date('2000-01-01');
      const mockUpdatedUser: User = {
        id: userId,
        nombre: 'Test User',
        email: 'test@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: newExpirationDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateStub = prismaMock.user.update;
      updateStub.resolves(mockUpdatedUser);

      const result = await repository.updatePermitExpiration(
        userId,
        newExpirationDate
      );

      expect(result).to.deep.equal(mockUpdatedUser);
      sinon.assert.calledOnceWithExactly(updateStub, {
        where: { id: userId },
        data: { permisoValidoHasta: newExpirationDate },
      });
    });
  });
});
