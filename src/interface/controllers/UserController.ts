import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/UserService';
import { VehicleService } from '../../services/VehicleService';

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
      const hasPagination =
        req.query.page !== undefined || req.query.limit !== undefined;

      if (hasPagination) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await this.userService.getAllUsersPaginated({
          page,
          limit,
        });
        res.status(200).json(result);
        return;
      }

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

  public getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  public revokePermit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.revokePermit(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
