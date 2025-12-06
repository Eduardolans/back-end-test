import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/VehicleService';
import { CreateVehicleDTO, TransferOwnershipDTO } from '../models/types';

export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  public registerVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req.body as CreateVehicleDTO;
      const vehicle = await this.vehicleService.registerVehicle(data);

      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  };

  public transferOwnership = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body as TransferOwnershipDTO;

      const vehicle = await this.vehicleService.transferOwnership(
        id,
        data.nuevo_propietario_id
      );

      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  };
}
