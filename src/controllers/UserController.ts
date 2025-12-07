import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { VehicleService } from '../services/VehicleService';

export class UserController {
  constructor(
    private userService: UserService,
    private vehicleService: VehicleService
  ) {}

  public getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  public getUserVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const vehicles = await this.vehicleService.getVehiclesByOwner(id);

      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  };
}
