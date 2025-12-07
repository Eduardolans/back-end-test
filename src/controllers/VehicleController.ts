import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/VehicleService';
import { CreateVehicleDTO, TransferOwnershipDTO } from '../models/types';

export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  public getAllVehicles = async (
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
        const result = await this.vehicleService.getAllVehiclesPaginated({
          page,
          limit,
        });
        res.status(200).json(result);
        return;
      }

      const vehicles = await this.vehicleService.getAllVehicles();
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  };

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

  public addAuthorizedDriver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { conductor_id } = req.body as { conductor_id: string };

      const authorizedDriver = await this.vehicleService.addAuthorizedDriver(
        id,
        conductor_id
      );

      res.status(201).json(authorizedDriver);
    } catch (error) {
      next(error);
    }
  };

  public removeAuthorizedDriver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id, conductorId } = req.params;

      await this.vehicleService.removeAuthorizedDriver(id, conductorId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
