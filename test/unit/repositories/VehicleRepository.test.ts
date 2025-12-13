import { expect } from 'chai';
import sinon from 'sinon';
import { VehicleRepository } from '../../../src/repositories/VehicleRepository';
import { LicenseType, VehicleType } from '../../../src/models/dataModels';
import { PrismaClient } from '@prisma/client';

interface MockPrismaClient {
  vehicle: {
    findUnique: sinon.SinonStub;
    findMany: sinon.SinonStub;
    create: sinon.SinonStub;
    update: sinon.SinonStub;
    count: sinon.SinonStub;
  };
}

describe('VehicleRepository Unit Tests', () => {
  let repository: VehicleRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = {
      vehicle: {
        findUnique: sinon.stub(),
        findMany: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        count: sinon.stub(),
      },
    };

    repository = new VehicleRepository(prismaMock as unknown as PrismaClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findById', () => {
    it('should call prisma.vehicle.findUnique with correct id and include owner', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'ABC123',
        tipo: VehicleType.coche,
        propietarioId: 'user-1',
        propietario: {
          id: 'user-1',
          nombre: 'John Doe',
          email: 'john@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date('2025-12-31'),
        },
      };

      prismaMock.vehicle.findUnique.resolves(mockVehicle);

      const result = await repository.findById('vehicle-1');

      expect(result).to.deep.equal(mockVehicle);
      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.findUnique, {
        where: { id: 'vehicle-1' },
        include: { propietario: true },
      });
    });

    it('should return null when vehicle does not exist', async () => {
      prismaMock.vehicle.findUnique.resolves(null);

      const result = await repository.findById('non-existent');

      expect(result).to.be.null;
    });
  });

  describe('findByMatricula', () => {
    it('should call prisma.vehicle.findUnique with correct matricula', async () => {
      const mockVehicle = {
        id: 'vehicle-2',
        marca: 'Honda',
        modelo: 'Civic',
        matricula: 'XYZ789',
        tipo: VehicleType.coche,
        propietarioId: 'user-2',
        propietario: {
          id: 'user-2',
          nombre: 'Jane Doe',
          email: 'jane@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date('2025-12-31'),
        },
      };

      prismaMock.vehicle.findUnique.resolves(mockVehicle);

      const result = await repository.findByMatricula('XYZ789');

      expect(result).to.deep.equal(mockVehicle);
      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.findUnique, {
        where: { matricula: 'XYZ789' },
        include: { propietario: true },
      });
    });

    it('should return null when matricula not found', async () => {
      prismaMock.vehicle.findUnique.resolves(null);

      const result = await repository.findByMatricula('NOTFOUND');

      expect(result).to.be.null;
    });
  });

  describe('create', () => {
    it('should call prisma.vehicle.create with correct data', async () => {
      const createData = {
        marca: 'Mazda',
        modelo: 'CX-5',
        matricula: 'NEW123',
        tipo: VehicleType.coche,
        propietario_id: 'user-3',
      };

      const mockCreatedVehicle = {
        id: 'vehicle-3',
        marca: 'Mazda',
        modelo: 'CX-5',
        matricula: 'NEW123',
        tipo: VehicleType.coche,
        propietarioId: 'user-3',
        propietario: {
          id: 'user-3',
          nombre: 'Test User',
          email: 'test@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date('2025-12-31'),
        },
      };

      prismaMock.vehicle.create.resolves(mockCreatedVehicle);

      const result = await repository.create(createData);

      expect(result).to.deep.equal(mockCreatedVehicle);
      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.create, {
        data: {
          marca: 'Mazda',
          modelo: 'CX-5',
          matricula: 'NEW123',
          tipo: VehicleType.coche,
          propietarioId: 'user-3',
        },
        include: { propietario: true },
      });
    });
  });

  describe('updateOwner', () => {
    it('should call prisma.vehicle.update with new owner id', async () => {
      const mockUpdatedVehicle = {
        id: 'vehicle-4',
        marca: 'Ford',
        modelo: 'Fiesta',
        matricula: 'UPD456',
        tipo: VehicleType.coche,
        propietarioId: 'user-new',
        propietario: {
          id: 'user-new',
          nombre: 'New Owner',
          email: 'newowner@test.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: new Date('2025-12-31'),
        },
      };

      prismaMock.vehicle.update.resolves(mockUpdatedVehicle);

      const result = await repository.updateOwner('vehicle-4', 'user-new');

      expect(result).to.deep.equal(mockUpdatedVehicle);
      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.update, {
        where: { id: 'vehicle-4' },
        data: { propietarioId: 'user-new' },
        include: { propietario: true },
      });
    });
  });

  describe('findByOwner', () => {
    it('should call prisma.vehicle.findMany with owner id', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-5',
          marca: 'Car1',
          modelo: 'Model1',
          matricula: 'OWN001',
          tipo: VehicleType.coche,
          propietarioId: 'owner-1',
          propietario: {
            id: 'owner-1',
            nombre: 'Owner',
            email: 'owner@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
        {
          id: 'vehicle-6',
          marca: 'Car2',
          modelo: 'Model2',
          matricula: 'OWN002',
          tipo: VehicleType.coche,
          propietarioId: 'owner-1',
          propietario: {
            id: 'owner-1',
            nombre: 'Owner',
            email: 'owner@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
      ];

      prismaMock.vehicle.findMany.resolves(mockVehicles);

      const result = await repository.findByOwner('owner-1');

      expect(result).to.deep.equal(mockVehicles);
      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.findMany, {
        where: { propietarioId: 'owner-1' },
        include: { propietario: true },
      });
    });

    it('should return empty array when owner has no vehicles', async () => {
      prismaMock.vehicle.findMany.resolves([]);

      const result = await repository.findByOwner('owner-no-vehicles');

      expect(result).to.deep.equal([]);
    });
  });

  describe('findAll', () => {
    it('should call prisma.vehicle.findMany and return all vehicles', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-7',
          marca: 'Brand1',
          modelo: 'Model1',
          matricula: 'ALL001',
          tipo: VehicleType.coche,
          propietarioId: 'user-1',
          propietario: {
            id: 'user-1',
            nombre: 'User 1',
            email: 'user1@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
      ];

      prismaMock.vehicle.findMany.resolves(mockVehicles);

      const result = await repository.findAll();

      expect(result).to.deep.equal(mockVehicles);
      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.findMany, {
        include: { propietario: true },
      });
    });

    it('should return empty array when no vehicles exist', async () => {
      prismaMock.vehicle.findMany.resolves([]);

      const result = await repository.findAll();

      expect(result).to.deep.equal([]);
    });
  });

  describe('findAllPaginated', () => {
    it('should call prisma methods with correct pagination', async () => {
      const mockVehicles = [
        {
          id: 'vehicle-8',
          marca: 'Brand1',
          modelo: 'Model1',
          matricula: 'PAG001',
          tipo: VehicleType.coche,
          propietarioId: 'user-1',
          propietario: {
            id: 'user-1',
            nombre: 'User 1',
            email: 'user1@test.com',
            tipoPermiso: LicenseType.B,
            permisoValidoHasta: new Date('2025-12-31'),
          },
        },
      ];

      prismaMock.vehicle.findMany.resolves(mockVehicles);
      prismaMock.vehicle.count.resolves(10);

      const result = await repository.findAllPaginated({ page: 2, limit: 3 });

      expect(result.data).to.deep.equal(mockVehicles);
      expect(result.total).to.equal(10);
      expect(result.page).to.equal(2);
      expect(result.limit).to.equal(3);
      expect(result.totalPages).to.equal(4);

      sinon.assert.calledOnceWithExactly(prismaMock.vehicle.findMany, {
        skip: 3,
        take: 3,
        include: { propietario: true },
      });

      sinon.assert.calledOnce(prismaMock.vehicle.count);
    });
  });
});
