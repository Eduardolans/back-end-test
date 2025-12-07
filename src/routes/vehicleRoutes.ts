import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { VehicleService } from '../services/VehicleService';
import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../repositories/AuthorizedDriverRepository';
import { LicenseValidator } from '../services/LicenseValidator';

const router = Router();

const userRepository = new UserRepository();
const vehicleRepository = new VehicleRepository();
const authorizedDriverRepository = new AuthorizedDriverRepository();
const licenseValidator = new LicenseValidator();
const vehicleService = new VehicleService(
  userRepository,
  vehicleRepository,
  authorizedDriverRepository,
  licenseValidator
);
const vehicleController = new VehicleController(vehicleService);

router.get('/', vehicleController.getAllVehicles);
router.post('/', vehicleController.registerVehicle);
router.put('/:id/propietario', vehicleController.transferOwnership);
router.post('/:id/conductores', vehicleController.addAuthorizedDriver);
router.delete(
  '/:id/conductores/:conductorId',
  vehicleController.removeAuthorizedDriver
);

export default router;
