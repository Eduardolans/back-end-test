import { expect } from 'chai';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../../src/repositories/AuthorizedDriverRepository';
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

describe('AuthorizedDriverRepository Integration Tests', () => {
  let vehicleRepository: VehicleRepository;
  let authorizedDriverRepository: AuthorizedDriverRepository;
  let testUserId: string;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.ownershipHistory.deleteMany();
    await prisma.authorizedDriver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    vehicleRepository = new VehicleRepository();
    authorizedDriverRepository = new AuthorizedDriverRepository();

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

  describe('AuthorizedDriverRepository', () => {
    describe('addDriver', () => {
      it('should add driver and return with user data', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);

        const driver = await createTestUser({
          nombre: 'Authorized Driver',
          email: 'driver@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        });

        const vehicle = await vehicleRepository.create({
          marca: 'Ford',
          modelo: 'Focus',
          matricula: 'INT004',
          tipo: VehicleType.coche,
          propietario_id: testUserId,
        });

        const result = await authorizedDriverRepository.addDriver(
          vehicle.id,
          driver.id
        );

        expect(result).to.have.property('id');
        expect(result.vehicleId).to.equal(vehicle.id);
        expect(result.userId).to.equal(driver.id);
        expect(result.user).to.exist;
        expect(result.user.id).to.equal(driver.id);
        expect(result.user.nombre).to.equal('Authorized Driver');
        expect(result.user.email).to.equal('driver@integration.com');
        expect(result.user.tipoPermiso).to.equal(LicenseType.B);
        expect(result.user.permisoValidoHasta).to.exist;

        const fromDb = await authorizedDriverRepository.findByVehicle(
          vehicle.id
        );
        expect(fromDb).to.have.lengthOf(1);
        expect(fromDb[0].userId).to.equal(driver.id);
      });
    });

    describe('findByVehicle', () => {
      it('should return all authorized drivers for a vehicle', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);

        const driver1 = await createTestUser({
          nombre: 'Driver 1',
          email: 'driver1@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        });

        const driver2 = await createTestUser({
          nombre: 'Driver 2',
          email: 'driver2@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        });

        const vehicle = await vehicleRepository.create({
          marca: 'Nissan',
          modelo: 'Sentra',
          matricula: 'INT005',
          tipo: VehicleType.coche,
          propietario_id: testUserId,
        });

        await authorizedDriverRepository.addDriver(vehicle.id, driver1.id);
        await authorizedDriverRepository.addDriver(vehicle.id, driver2.id);

        const result = await authorizedDriverRepository.findByVehicle(
          vehicle.id
        );

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.have.property('id');
        expect(result[0].vehicleId).to.equal(vehicle.id);
        expect(result[0].user).to.exist;
        expect(result[1].user).to.exist;
      });

      it('should return empty array when no authorized drivers exist', async () => {
        const vehicle = await vehicleRepository.create({
          marca: 'Chevrolet',
          modelo: 'Spark',
          matricula: 'INT006',
          tipo: VehicleType.coche,
          propietario_id: testUserId,
        });

        const result = await authorizedDriverRepository.findByVehicle(
          vehicle.id
        );

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(0);
      });
    });

    describe('removeDriver', () => {
      it('should remove authorized driver', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);

        const driver = await createTestUser({
          nombre: 'Driver to Remove',
          email: 'remove@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        });

        const vehicle = await vehicleRepository.create({
          marca: 'Kia',
          modelo: 'Rio',
          matricula: 'INT007',
          tipo: VehicleType.coche,
          propietario_id: testUserId,
        });

        await authorizedDriverRepository.addDriver(vehicle.id, driver.id);

        const result = await authorizedDriverRepository.removeDriver(
          vehicle.id,
          driver.id
        );

        expect(result).to.have.property('count');
        expect(result.count).to.equal(1);

        const remaining = await authorizedDriverRepository.findByVehicle(
          vehicle.id
        );
        expect(remaining).to.have.lengthOf(0);
      });
    });
  });
});
