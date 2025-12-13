import { VehicleType } from '@prisma/client';

export { VehicleType };

export interface CreateVehicleDTO {
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
  propietario_id: string;
}

export interface TransferOwnershipDTO {
  nuevo_propietario_id: string;
}

export interface VehicleResponseDTO {
  id: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
