import { expect } from 'chai';
import sinon from 'sinon';
import { OwnershipHistoryRepository } from '../../../src/repositories/OwnershipHistoryRepository';
import { PrismaClient, LicenseType } from '@prisma/client';

interface MockPrismaClient {
  ownershipHistory: {
    create: sinon.SinonStub;
    findMany: sinon.SinonStub;
    updateMany: sinon.SinonStub;
  };
}

describe('OwnershipHistoryRepository Unit Tests', () => {
  let repository: OwnershipHistoryRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = {
      ownershipHistory: {
        create: sinon.stub(),
        findMany: sinon.stub(),
        updateMany: sinon.stub(),
      },
    };

    repository = new OwnershipHistoryRepository(
      prismaMock as unknown as PrismaClient
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should call prisma.ownershipHistory.create with correct data', async () => {
      const mockOwnership = {
        id: 'ownership-1',
        vehicleId: 'vehicle-1',
        userId: 'user-1',
        fechaInicio: new Date('2025-01-01'),
        fechaFin: null,
      };

      prismaMock.ownershipHistory.create.resolves(mockOwnership);

      const result = await repository.create('vehicle-1', 'user-1');

      expect(result).to.deep.equal(mockOwnership);
      sinon.assert.calledOnce(prismaMock.ownershipHistory.create);

      const createCall = prismaMock.ownershipHistory.create.getCall(0);
      expect(createCall.args[0].data.vehicleId).to.equal('vehicle-1');
      expect(createCall.args[0].data.userId).to.equal('user-1');
      expect(createCall.args[0].data.fechaInicio).to.be.instanceOf(Date);
    });
  });

  describe('findByVehicle', () => {
    it('should call prisma.ownershipHistory.findMany with vehicle id', async () => {
      const mockOwnerships = [
        {
          id: 'ownership-2',
          vehicleId: 'vehicle-2',
          userId: 'user-2',
          fechaInicio: new Date('2025-01-01'),
          fechaFin: null,
          user: {
            id: 'user-2',
            nombre: 'Current Owner',
            email: 'owner@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
        {
          id: 'ownership-3',
          vehicleId: 'vehicle-2',
          userId: 'user-3',
          fechaInicio: new Date('2024-01-01'),
          fechaFin: new Date('2024-12-31'),
          user: {
            id: 'user-3',
            nombre: 'Previous Owner',
            email: 'previous@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
      ];

      prismaMock.ownershipHistory.findMany.resolves(mockOwnerships);

      const result = await repository.findByVehicle('vehicle-2');

      expect(result).to.deep.equal(mockOwnerships);
      sinon.assert.calledOnceWithExactly(prismaMock.ownershipHistory.findMany, {
        where: { vehicleId: 'vehicle-2' },
        orderBy: { fechaInicio: 'desc' },
        include: { user: true },
      });
    });

    it('should return empty array when vehicle has no ownership history', async () => {
      prismaMock.ownershipHistory.findMany.resolves([]);

      const result = await repository.findByVehicle('vehicle-empty');

      expect(result).to.deep.equal([]);
    });
  });

  describe('closeCurrentOwnership', () => {
    it('should call prisma.ownershipHistory.updateMany with correct data', async () => {
      const mockUpdateResult = { count: 1 };

      prismaMock.ownershipHistory.updateMany.resolves(mockUpdateResult);

      await repository.closeCurrentOwnership('vehicle-3', 'user-4');

      sinon.assert.calledOnce(prismaMock.ownershipHistory.updateMany);

      const updateCall = prismaMock.ownershipHistory.updateMany.getCall(0);
      expect(updateCall.args[0].where.vehicleId).to.equal('vehicle-3');
      expect(updateCall.args[0].where.userId).to.equal('user-4');
      expect(updateCall.args[0].where.fechaFin).to.be.null;
      expect(updateCall.args[0].data.fechaFin).to.be.instanceOf(Date);
    });

    it('should update nothing when no active ownership exists', async () => {
      prismaMock.ownershipHistory.updateMany.resolves({ count: 0 });

      await repository.closeCurrentOwnership('non-existent', 'non-existent');

      sinon.assert.calledOnce(prismaMock.ownershipHistory.updateMany);
    });
  });
});
