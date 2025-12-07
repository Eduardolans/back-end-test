import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { VehicleService } from '../services/VehicleService';
import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { LicenseValidator } from '../services/LicenseValidator';

const router = Router();

const userRepository = new UserRepository();
const vehicleRepository = new VehicleRepository();
const licenseValidator = new LicenseValidator();
const userService = new UserService(userRepository);
const vehicleService = new VehicleService(
  userRepository,
  vehicleRepository,
  licenseValidator
);
const userController = new UserController(userService, vehicleService);

router.get('/', userController.getAllUsers);
router.get('/:id/vehiculos', userController.getUserVehicles);

export default router;
