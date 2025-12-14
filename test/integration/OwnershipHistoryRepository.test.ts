import { expect } from 'chai';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';
import { OwnershipHistoryRepository } from '../../src/repositories/OwnershipHistoryRepository';
import { getPrismaClient } from '../../src/repositories/prisma';
import { User, LicenseType, VehicleType } from '@prisma/client';

async function createTestUser(data: {
  nombre: string;
  email: string;
  tipoPermiso: LicenseType;
  permisoValidoHasta: Date;
}): Promise<User> {
  const prisma = getPrismaClient();
  return await prisma.user.create({ data });
}

describe('OwnershipHistoryRepository Integration Tests', () => {
  let vehicleRepository: VehicleRepository;
  let ownershipHistoryRepository: OwnershipHistoryRepository;
  let testUserId: string;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.ownershipHistory.deleteMany();
    await prisma.authorizedDriver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    vehicleRepository = new VehicleRepository();
    ownershipHistoryRepository = new OwnershipHistoryRepository();

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
    it('should create ownership history record with fechaInicio', async () => {
      const vehicle = await vehicleRepository.create({
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'HIST001',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await ownershipHistoryRepository.create(
        vehicle.id,
        testUserId
      );

      expect(result).to.have.property('id');
      expect(result).to.have.property('createdAt');
      expect(result.vehicleId).to.equal(vehicle.id);
      expect(result.userId).to.equal(testUserId);
      expect(result.fechaInicio).to.be.instanceOf(Date);
      expect(result.fechaFin).to.be.null;

      const historyFromDb = await ownershipHistoryRepository.findByVehicle(
        vehicle.id
      );
      expect(historyFromDb).to.have.lengthOf(1);
      expect(historyFromDb[0].vehicleId).to.equal(vehicle.id);
      expect(historyFromDb[0].userId).to.equal(testUserId);
      expect(historyFromDb[0].fechaFin).to.be.null;
    });
  });

  describe('findByVehicle', () => {
    it('should return ownership history ordered by fechaInicio DESC', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const owner1 = await createTestUser({
        nombre: 'First Owner',
        email: 'owner1@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      const owner2 = await createTestUser({
        nombre: 'Second Owner',
        email: 'owner2@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      const vehicle = await vehicleRepository.create({
        marca: 'Honda',
        modelo: 'Civic',
        matricula: 'HIST002',
        tipo: VehicleType.coche,
        propietario_id: owner1.id,
      });

      await ownershipHistoryRepository.create(vehicle.id, owner1.id);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await ownershipHistoryRepository.closeCurrentOwnership(
        vehicle.id,
        owner1.id
      );
      await ownershipHistoryRepository.create(vehicle.id, owner2.id);

      const result = await ownershipHistoryRepository.findByVehicle(vehicle.id);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0].user).to.exist;
      expect(result[0].user.id).to.equal(owner2.id);
      expect(result[0].user.nombre).to.equal('Second Owner');
      expect(result[0].fechaFin).to.be.null;
      expect(result[1].user.id).to.equal(owner1.id);
      expect(result[1].user.nombre).to.equal('First Owner');
      expect(result[1].fechaFin).to.not.be.null;
    });

    it('should return empty array when vehicle has no history', async () => {
      const vehicle = await vehicleRepository.create({
        marca: 'Mazda',
        modelo: 'CX-5',
        matricula: 'HIST003',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await ownershipHistoryRepository.findByVehicle(vehicle.id);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
  });

  describe('closeCurrentOwnership', () => {
    it('should set fechaFin for current ownership', async () => {
      const vehicle = await vehicleRepository.create({
        marca: 'Ford',
        modelo: 'Focus',
        matricula: 'HIST004',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await ownershipHistoryRepository.create(vehicle.id, testUserId);

      const beforeClose = await ownershipHistoryRepository.findByVehicle(
        vehicle.id
      );
      expect(beforeClose[0].fechaFin).to.be.null;

      await ownershipHistoryRepository.closeCurrentOwnership(
        vehicle.id,
        testUserId
      );

      const afterClose = await ownershipHistoryRepository.findByVehicle(
        vehicle.id
      );
      expect(afterClose[0].fechaFin).to.not.be.null;
      expect(afterClose[0].fechaFin).to.be.instanceOf(Date);
    });

    it('should only close ownership for specified user', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const owner2 = await createTestUser({
        nombre: 'Other Owner',
        email: 'other@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      const vehicle1 = await vehicleRepository.create({
        marca: 'Kia',
        modelo: 'Rio',
        matricula: 'HIST005',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const vehicle2 = await vehicleRepository.create({
        marca: 'Nissan',
        modelo: 'Sentra',
        matricula: 'HIST006',
        tipo: VehicleType.coche,
        propietario_id: owner2.id,
      });

      await ownershipHistoryRepository.create(vehicle1.id, testUserId);
      await ownershipHistoryRepository.create(vehicle2.id, owner2.id);

      await ownershipHistoryRepository.closeCurrentOwnership(
        vehicle1.id,
        testUserId
      );

      const vehicle1History = await ownershipHistoryRepository.findByVehicle(
        vehicle1.id
      );
      const vehicle2History = await ownershipHistoryRepository.findByVehicle(
        vehicle2.id
      );

      expect(vehicle1History[0].fechaFin).to.not.be.null;
      expect(vehicle2History[0].fechaFin).to.be.null;
    });
  });
});
