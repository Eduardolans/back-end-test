import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { VehicleService } from '../../services/VehicleService';
import { UserRepository } from '../../repositories/UserRepository';
import { VehicleRepository } from '../../repositories/VehicleRepository';
import { AuthorizedDriverRepository } from '../../repositories/AuthorizedDriverRepository';
import { OwnershipHistoryRepository } from '../../repositories/OwnershipHistoryRepository';
import { LicenseValidator } from '../../services/LicenseValidator';
import { VehicleValidator } from '../../services/VehicleValidator';

const router = Router();

const userRepository = new UserRepository();
const vehicleRepository = new VehicleRepository();
const authorizedDriverRepository = new AuthorizedDriverRepository();
const ownershipHistoryRepository = new OwnershipHistoryRepository();
const licenseValidator = new LicenseValidator();
const vehicleValidator = new VehicleValidator(
  userRepository,
  vehicleRepository,
  licenseValidator
);
const vehicleService = new VehicleService(
  vehicleRepository,
  authorizedDriverRepository,
  ownershipHistoryRepository,
  vehicleValidator
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
router.get('/:id/historial', vehicleController.getOwnershipHistory);

export default router;
