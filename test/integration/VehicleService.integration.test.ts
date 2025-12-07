import { expect } from 'chai';
import { VehicleService } from '../../src/services/VehicleService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';
import { LicenseValidator } from '../../src/services/LicenseValidator';
import { getPrismaClient } from '../../src/utils/prisma';
import { LicenseType, VehicleType } from '../../src/models/types';

describe('VehicleService Integration Tests', () => {
  let vehicleService: VehicleService;
  let userRepository: UserRepository;
  let vehicleRepository: VehicleRepository;
  let testUserId: string;

  beforeEach(async () => {
    const prisma = getPrismaClient();

    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    userRepository = new UserRepository();
    vehicleRepository = new VehicleRepository();
    const licenseValidator = new LicenseValidator();
    vehicleService = new VehicleService(
      userRepository,
      vehicleRepository,
      licenseValidator
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
      expect(result.propietarioId).to.equal(testUserId);

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

      expect(result.propietarioId).to.equal(newOwner.id);

      const vehicleFromDb = await vehicleRepository.findById(vehicle.id);
      expect(vehicleFromDb?.propietarioId).to.equal(newOwner.id);
    });
  });
});
