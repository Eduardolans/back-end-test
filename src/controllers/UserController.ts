import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/VehicleService';

export class UserController {
  constructor(private vehicleService: VehicleService) {}

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
