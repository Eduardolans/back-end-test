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

      const vehicleFromDb = await vehicleRepository.findById(result.id);
      expect(vehicleFromDb).to.not.be.null;
      expect(vehicleFromDb?.id).to.equal(result.id);
      expect(vehicleFromDb?.marca).to.equal('Toyota');
      expect(vehicleFromDb?.modelo).to.equal('Corolla');
      expect(vehicleFromDb?.matricula).to.equal('INT001');
      expect(vehicleFromDb?.tipo).to.equal(VehicleType.coche);
      expect(vehicleFromDb?.propietarioId).to.equal(testUserId);
      expect(vehicleFromDb?.propietario).to.exist;
      expect(vehicleFromDb?.propietario.id).to.equal(testUserId);
      expect(vehicleFromDb?.propietario.nombre).to.equal('Test User');
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

  describe('findByMatricula', () => {
    it('should find vehicle by matricula with owner', async () => {
      const created = await vehicleRepository.create({
        marca: 'Volkswagen',
        modelo: 'Golf',
        matricula: 'UNIQUE123',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.findByMatricula('UNIQUE123');

      expect(result).to.not.be.null;
      expect(result?.id).to.equal(created.id);
      expect(result?.marca).to.equal('Volkswagen');
      expect(result?.modelo).to.equal('Golf');
      expect(result?.matricula).to.equal('UNIQUE123');
      expect(result?.tipo).to.equal(VehicleType.coche);
      expect(result?.propietarioId).to.equal(testUserId);
      expect(result?.propietario).to.exist;
      expect(result?.propietario.id).to.equal(testUserId);
      expect(result?.propietario.nombre).to.equal('Test User');
    });

    it('should return null when matricula does not exist', async () => {
      const result = await vehicleRepository.findByMatricula('NONEXISTENT');
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

  describe('findByOwner', () => {
    it('should return all vehicles owned by a user', async () => {
      await vehicleRepository.create({
        marca: 'Toyota',
        modelo: 'Camry',
        matricula: 'OWNER001',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Honda',
        modelo: 'Accord',
        matricula: 'OWNER002',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.findByOwner(testUserId);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0].propietarioId).to.equal(testUserId);
      expect(result[0].propietario).to.exist;
      expect(result[0].propietario.id).to.equal(testUserId);
      expect(result[1].propietarioId).to.equal(testUserId);
      expect(result[1].propietario).to.exist;
    });

    it('should return empty array when user has no vehicles', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const userWithNoVehicles = await createTestUser({
        nombre: 'No Vehicles User',
        email: 'novehicles@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      const result = await vehicleRepository.findByOwner(userWithNoVehicles.id);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
  });

  describe('findAll', () => {
    it('should return all vehicles with owners', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const user2 = await createTestUser({
        nombre: 'User 2',
        email: 'user2@test.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      });

      await vehicleRepository.create({
        marca: 'Ford',
        modelo: 'Fiesta',
        matricula: 'ALL001',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Chevrolet',
        modelo: 'Spark',
        matricula: 'ALL002',
        tipo: VehicleType.coche,
        propietario_id: user2.id,
      });

      await vehicleRepository.create({
        marca: 'Nissan',
        modelo: 'Versa',
        matricula: 'ALL003',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.findAll();

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.have.property('id');
      expect(result[0]).to.have.property('propietario');
      expect(result[0].propietario).to.have.property('id');
      expect(result[0].propietario).to.have.property('nombre');
      expect(result[1]).to.have.property('propietario');
      expect(result[2]).to.have.property('propietario');
    });

    it('should return empty array when no vehicles exist', async () => {
      const result = await vehicleRepository.findAll();

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated vehicles with metadata', async () => {
      await vehicleRepository.create({
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'PAG001',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Honda',
        modelo: 'Civic',
        matricula: 'PAG002',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Mazda',
        modelo: 'CX-5',
        matricula: 'PAG003',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Ford',
        modelo: 'Focus',
        matricula: 'PAG004',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Nissan',
        modelo: 'Sentra',
        matricula: 'PAG005',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.findAllPaginated({
        page: 1,
        limit: 2,
      });

      expect(result).to.have.property('data');
      expect(result).to.have.property('total');
      expect(result).to.have.property('page');
      expect(result).to.have.property('limit');
      expect(result).to.have.property('totalPages');
      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(2);
      expect(result.total).to.equal(5);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(2);
      expect(result.totalPages).to.equal(3);
      expect(result.data[0]).to.have.property('propietario');
      expect(result.data[0].propietario).to.have.property('id');
      expect(result.data[1]).to.have.property('propietario');
    });

    it('should return second page of results', async () => {
      await vehicleRepository.create({
        marca: 'Toyota',
        modelo: 'Yaris',
        matricula: 'PAG101',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Honda',
        modelo: 'Fit',
        matricula: 'PAG102',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      await vehicleRepository.create({
        marca: 'Mazda',
        modelo: '3',
        matricula: 'PAG103',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleRepository.findAllPaginated({
        page: 2,
        limit: 2,
      });

      expect(result.page).to.equal(2);
      expect(result.data).to.have.lengthOf(1);
      expect(result.total).to.equal(3);
      expect(result.totalPages).to.equal(2);
    });

    it('should return empty data array when page exceeds total pages', async () => {
      const result = await vehicleRepository.findAllPaginated({
        page: 10,
        limit: 10,
      });

      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(0);
      expect(result.total).to.equal(0);
      expect(result.totalPages).to.equal(0);
    });
  });
});
