import { expect } from 'chai';
import sinon from 'sinon';
import { AuthorizedDriverRepository } from '../../../src/repositories/AuthorizedDriverRepository';
import { PrismaClient, LicenseType } from '@prisma/client';

interface MockPrismaClient {
  authorizedDriver: {
    create: sinon.SinonStub;
    findMany: sinon.SinonStub;
    deleteMany: sinon.SinonStub;
  };
}

describe('AuthorizedDriverRepository Unit Tests', () => {
  let repository: AuthorizedDriverRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = {
      authorizedDriver: {
        create: sinon.stub(),
        findMany: sinon.stub(),
        deleteMany: sinon.stub(),
      },
    };

    repository = new AuthorizedDriverRepository(
      prismaMock as unknown as PrismaClient
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('addDriver', () => {
    it('should call prisma.authorizedDriver.create with correct data', async () => {
      const mockAuthorizedDriver = {
        id: 'auth-1',
        vehicleId: 'vehicle-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          nombre: 'Authorized Driver',
          email: 'driver@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date('2025-12-31'),
        },
      };

      prismaMock.authorizedDriver.create.resolves(mockAuthorizedDriver);

      const result = await repository.addDriver('vehicle-1', 'user-1');

      expect(result).to.deep.equal(mockAuthorizedDriver);
      sinon.assert.calledOnceWithExactly(prismaMock.authorizedDriver.create, {
        data: {
          vehicleId: 'vehicle-1',
          userId: 'user-1',
        },
        include: { user: true },
      });
    });
  });

  describe('findByVehicle', () => {
    it('should call prisma.authorizedDriver.findMany with vehicle id', async () => {
      const mockAuthorizedDrivers = [
        {
          id: 'auth-2',
          vehicleId: 'vehicle-2',
          userId: 'user-2',
          user: {
            id: 'user-2',
            nombre: 'Driver 1',
            email: 'driver1@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
        {
          id: 'auth-3',
          vehicleId: 'vehicle-2',
          userId: 'user-3',
          user: {
            id: 'user-3',
            nombre: 'Driver 2',
            email: 'driver2@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
      ];

      prismaMock.authorizedDriver.findMany.resolves(mockAuthorizedDrivers);

      const result = await repository.findByVehicle('vehicle-2');

      expect(result).to.deep.equal(mockAuthorizedDrivers);
      sinon.assert.calledOnceWithExactly(prismaMock.authorizedDriver.findMany, {
        where: { vehicleId: 'vehicle-2' },
        include: { user: true },
      });
    });

    it('should return empty array when vehicle has no authorized drivers', async () => {
      prismaMock.authorizedDriver.findMany.resolves([]);

      const result = await repository.findByVehicle('vehicle-empty');

      expect(result).to.deep.equal([]);
    });
  });

  describe('removeDriver', () => {
    it('should call prisma.authorizedDriver.deleteMany with correct ids', async () => {
      const mockDeleteResult = { count: 1 };

      prismaMock.authorizedDriver.deleteMany.resolves(mockDeleteResult);

      const result = await repository.removeDriver('vehicle-3', 'user-4');

      expect(result).to.deep.equal(mockDeleteResult);
      sinon.assert.calledOnceWithExactly(
        prismaMock.authorizedDriver.deleteMany,
        {
          where: {
            vehicleId: 'vehicle-3',
            userId: 'user-4',
          },
        }
      );
    });

    it('should return count 0 when driver does not exist', async () => {
      prismaMock.authorizedDriver.deleteMany.resolves({
        count: 0,
      });

      const result = await repository.removeDriver(
        'non-existent',
        'non-existent'
      );

      expect(result.count).to.equal(0);
    });
  });
});
