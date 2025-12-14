import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../../services/VehicleService';
import {
  CreateVehicleBusiness,
  TransferOwnershipBusiness,
} from '../../services/types';

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
      const data = req.body as CreateVehicleBusiness;
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
      const data = req.body as TransferOwnershipBusiness;

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

  public getAuthorizedDrivers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const drivers = await this.vehicleService.getAuthorizedDrivers(id);

      res.status(200).json(drivers);
    } catch (error) {
      next(error);
    }
  };

  public getOwnershipHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const history = await this.vehicleService.getOwnershipHistory(id);

      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  };
}
