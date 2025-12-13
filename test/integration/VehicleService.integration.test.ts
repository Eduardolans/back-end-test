import { expect } from 'chai';
import { VehicleService } from '../../src/services/VehicleService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../../src/repositories/AuthorizedDriverRepository';
import { OwnershipHistoryRepository } from '../../src/repositories/OwnershipHistoryRepository';
import { LicenseValidator } from '../../src/services/LicenseValidator';
import { VehicleValidator } from '../../src/validators/VehicleValidator';
import { getPrismaClient } from '../../src/utils/prisma';
import { LicenseType, VehicleType } from '../../src/models/dataModels';

describe('VehicleService Integration Tests', () => {
  let vehicleService: VehicleService;
  let userRepository: UserRepository;
  let vehicleRepository: VehicleRepository;
  let authorizedDriverRepository: AuthorizedDriverRepository;
  let ownershipHistoryRepository: OwnershipHistoryRepository;
  let testUserId: string;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.ownershipHistory.deleteMany();
    await prisma.authorizedDriver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    userRepository = new UserRepository();
    vehicleRepository = new VehicleRepository();
    authorizedDriverRepository = new AuthorizedDriverRepository();
    ownershipHistoryRepository = new OwnershipHistoryRepository();
    const licenseValidator = new LicenseValidator();
    const vehicleValidator = new VehicleValidator(
      userRepository,
      vehicleRepository,
      licenseValidator
    );
    vehicleService = new VehicleService(
      vehicleRepository,
      authorizedDriverRepository,
      ownershipHistoryRepository,
      vehicleValidator
    );

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const testUser = await prisma.user.create({
      data: {
        nombre: 'Test User',
        email: 'test@integration.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: futureDate,
      },
    });
    testUserId = testUser.id;
  });

  describe('registerVehicle', () => {
    it('should register vehicle and persist to database', async () => {
      const vehicleData = {
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'INT001',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      };

      const result = await vehicleService.registerVehicle(vehicleData);

      expect(result).to.have.property('id');
      expect(result.marca).to.equal('Toyota');
      expect(result.propietario).to.exist;
      expect(result.propietario.id).to.equal(testUserId);
      expect(result).to.not.have.property('propietarioId');

      const vehicleFromDb = await vehicleRepository.findById(result.id);
      expect(vehicleFromDb).to.not.be.null;
      expect(vehicleFromDb?.matricula).to.equal('INT001');
    });
  });

  describe('transferOwnership', () => {
    it('should transfer vehicle and update database', async () => {
      const prisma = getPrismaClient();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const newOwner = await prisma.user.create({
        data: {
          nombre: 'New Owner',
          email: 'newowner@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        },
      });

      const vehicle = await vehicleService.registerVehicle({
        marca: 'Honda',
        modelo: 'Civic',
        matricula: 'INT002',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleService.transferOwnership(
        vehicle.id,
        newOwner.id
      );

      expect(result.propietario).to.exist;
      expect(result.propietario.id).to.equal(newOwner.id);
      expect(result.propietario.nombre).to.equal('New Owner');
      expect(result).to.not.have.property('propietarioId');

      const vehicleFromDb = await vehicleRepository.findById(vehicle.id);
      expect(vehicleFromDb?.propietarioId).to.equal(newOwner.id);
    });
  });

  describe('addAuthorizedDriver', () => {
    it('should add authorized driver and persist to database', async () => {
      const prisma = getPrismaClient();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const driver = await prisma.user.create({
        data: {
          nombre: 'Authorized Driver',
          email: 'driver@integration.com',
          tipoPermiso: LicenseType.B,
          permisoValidoHasta: futureDate,
        },
      });

      const vehicle = await vehicleService.registerVehicle({
        marca: 'Toyota',
        modelo: 'Camry',
        matricula: 'INT003',
        tipo: VehicleType.coche,
        propietario_id: testUserId,
      });

      const result = await vehicleService.addAuthorizedDriver(
        vehicle.id,
        driver.id
      );

      expect(result.vehicleId).to.equal(vehicle.id);
      expect(result.driver).to.exist;
      expect(result.driver.id).to.equal(driver.id);
      expect(result.driver.nombre).to.equal('Authorized Driver');
      expect(result).to.not.have.property('userId');

      const authDriversFromDb = await authorizedDriverRepository.findByVehicle(
        vehicle.id
      );
      expect(authDriversFromDb).to.have.lengthOf(1);
      expect(authDriversFromDb[0].userId).to.equal(driver.id);
    });
  });
});
