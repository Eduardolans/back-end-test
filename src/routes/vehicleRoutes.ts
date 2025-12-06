import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { VehicleService } from '../services/VehicleService';
import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { LicenseValidator } from '../services/LicenseValidator';

const router = Router();

const userRepository = new UserRepository();
const vehicleRepository = new VehicleRepository();
const licenseValidator = new LicenseValidator();
const vehicleService = new VehicleService(
  userRepository,
  vehicleRepository,
  licenseValidator
);
const vehicleController = new VehicleController(vehicleService);

router.post('/', vehicleController.registerVehicle);
router.put('/:id/propietario', vehicleController.transferOwnership);

export default router;
