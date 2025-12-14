import { LicenseType, VehicleType } from '@prisma/client';

export interface UserBusiness {
  id: string;
  nombre: string;
  email: string;
  tipoPermiso: LicenseType;
  permisoValidoHasta: Date;
}

export interface CreateVehicleBusiness {
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
  propietario_id: string;
}

export interface TransferOwnershipBusiness {
  nuevo_propietario_id: string;
}

export interface VehicleBusiness {
  id: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
  propietario: UserBusiness;
}

export interface AuthorizedDriverBusiness {
  id: string;
  vehicleId: string;
  driver: UserBusiness;
}

export interface OwnershipHistoryBusiness {
  id: string;
  vehicleId: string;
  owner: UserBusiness;
  fechaInicio: Date;
  fechaFin: Date | null;
}

export interface PaginationOptionsBusiness {
  page: number;
  limit: number;
}

export interface PaginatedResultBusiness<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
