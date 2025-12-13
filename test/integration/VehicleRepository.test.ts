import { expect } from 'chai';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';
import { getPrismaClient } from '../../src/utils/prisma';
import { LicenseType, VehicleType } from '../../src/models/dataModels';
import { User } from '@prisma/client';

async function createTestUser(data: {
  nombre: string;
  email: string;
  tipoPermiso: LicenseType;
  permisoValidoHasta: Date;
}): Promise<User> {
  const prisma = getPrismaClient();
  return await prisma.user.create({ data });
}

describe('VehicleRepository Integration Tests', () => {
  let vehicleRepository: VehicleRepository;
  let testUserId: string;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.ownershipHistory.deleteMany();
    await prisma.authorizedDriver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    vehicleRepository = new VehicleRepository();

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const testUser = await createTestUser({
      nombre: 'Test User',
      email: 'test@integration.com',
      tipoPermiso: LicenseType.B,
      permisoValidoHasta: futureDate,
    });
    testUserId = testUser.id;
  });

  describe('create', () => {
    it('should create vehicle and return with owner', async () => {
      const vehicleData = {
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'INT001',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      };

      const result = await vehicleRepository.create(vehicleData);

      expect(result).to.have.property('id');
      expect(result).to.have.property('createdAt');
      expect(result).to.have.property('updatedAt');
      expect(result.marca).to.equal('Toyota');
      expect(result.modelo).to.equal('Corolla');
      expect(result.matricula).to.equal('INT001');
      expect(result.tipo).to.equal(VehicleType.coche);
      expect(result.propietarioId).to.equal(testUserId);
      expect(result.propietario).to.exist;
      expect(result.propietario.id).to.equal(testUserId);
      expect(result.propietario.nombre).to.equal('Test User');
      expect(result.propietario.email).to.equal('test@integration.com');
      expect(result.propietario.tipoPermiso).to.equal(LicenseType.B);
      expect(result.propietario.permisoValidoHasta).to.exist;
    });
  });

  describe('findById', () => {
    it('should find vehicle by id with owner', async () => {
      const created = await vehicleRepository.create({
        marca: 'Honda',
        modelo: 'Civic',
        matricula: 'INT002',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.findById(created.id);

      expect(result).to.not.be.null;
      expect(result?.id).to.equal(created.id);
      expect(result?.marca).to.equal('Honda');
      expect(result?.modelo).to.equal('Civic');
      expect(result?.matricula).to.equal('INT002');
      expect(result?.tipo).to.equal(VehicleType.coche);
      expect(result?.propietario).to.exist;
      expect(result?.propietario.id).to.equal(testUserId);
      expect(result?.propietario.nombre).to.equal('Test User');
    });

    it('should return null when vehicle does not exist', async () => {
      const result = await vehicleRepository.findById('non-existent-id');
      expect(result).to.be.null;
    });
  });

  describe('updateOwner', () => {
    it('should update vehicle owner and return with new owner', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const newOwner = await createTestUser({
        nombre: 'New Owner',
        email: 'newowner@integration.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      const vehicle = await vehicleRepository.create({
        marca: 'Mazda',
        modelo: 'CX-5',
        matricula: 'INT003',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.updateOwner(
        vehicle.id,
        newOwner.id
      );

      expect(result.id).to.equal(vehicle.id);
      expect(result.marca).to.equal('Mazda');
      expect(result.modelo).to.equal('CX-5');
      expect(result.matricula).to.equal('INT003');
      expect(result.tipo).to.equal(VehicleType.coche);
      expect(result.propietarioId).to.equal(newOwner.id);
      expect(result.propietario).to.exist;
      expect(result.propietario.id).to.equal(newOwner.id);
      expect(result.propietario.nombre).to.equal('New Owner');
      expect(result.propietario.email).to.equal('newowner@integration.com');
      expect(result.propietario.tipoPermiso).to.equal(LicenseType.B);
      expect(result.propietario.permisoValidoHasta).to.exist;

      const vehicleFromDb = await vehicleRepository.findById(vehicle.id);
      expect(vehicleFromDb).to.not.be.null;
      expect(vehicleFromDb?.propietarioId).to.equal(newOwner.id);
      expect(vehicleFromDb?.propietario.nombre).to.equal('New Owner');
    });
  });
});
