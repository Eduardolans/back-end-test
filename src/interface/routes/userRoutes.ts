import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../../services/UserService';
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
const userService = new UserService(userRepository);
const vehicleService = new VehicleService(
  vehicleRepository,
  authorizedDriverRepository,
  ownershipHistoryRepository,
  vehicleValidator
);
const userController = new UserController(userService, vehicleService);

router.get('/', userController.getAllUsers);
router.get('/:id/vehiculos', userController.getUserVehicles);

export default router;
