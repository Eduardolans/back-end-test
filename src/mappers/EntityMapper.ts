import {
  User,
  Vehicle,
  AuthorizedDriver,
  OwnershipHistory,
} from '../models/dataModels';
import {
  UserBusiness,
  VehicleBusiness,
  AuthorizedDriverBusiness,
  OwnershipHistoryBusiness,
} from '../models/businessModels';

export class EntityMapper {
  static toUserBusiness(user: User): UserBusiness {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      tipoPermiso: user.tipoPermiso,
      permisoValidoHasta: user.permisoValidoHasta,
    };
  }

  static toVehicleBusiness(vehicle: Vehicle, owner: User): VehicleBusiness {
    return {
      id: vehicle.id,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      matricula: vehicle.matricula,
      tipo: vehicle.tipo,
      propietario: EntityMapper.toUserBusiness(owner),
    };
  }

  static toAuthorizedDriverBusiness(
    authorizedDriver: AuthorizedDriver,
    driver: User
  ): AuthorizedDriverBusiness {
    return {
      id: authorizedDriver.id,
      vehicleId: authorizedDriver.vehicleId,
      driver: EntityMapper.toUserBusiness(driver),
    };
  }

  static toOwnershipHistoryBusiness(
    ownershipHistory: OwnershipHistory,
    owner: User
  ): OwnershipHistoryBusiness {
    return {
      id: ownershipHistory.id,
      vehicleId: ownershipHistory.vehicleId,
      owner: EntityMapper.toUserBusiness(owner),
      fechaInicio: ownershipHistory.fechaInicio,
      fechaFin: ownershipHistory.fechaFin,
    };
  }
}
