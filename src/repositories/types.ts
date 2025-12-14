import {
  AuthorizedDriver,
  OwnershipHistory,
  User,
  Vehicle,
  VehicleType,
} from '@prisma/client';

export type AuthorizedDriverData = AuthorizedDriver & {
  user: User;
};

export type OwnershipHistoryData = OwnershipHistory & {
  user: User;
};

export type VehicleData = Vehicle & {
  propietario: User;
};

export interface CreateVehicleData {
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
  propietario_id: string;
}

export interface TransferOwnershipData {
  nuevo_propietario_id: string;
}

export interface PaginationOptionsData {
  page: number;
  limit: number;
}

export interface PaginatedResultData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
