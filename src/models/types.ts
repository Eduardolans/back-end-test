export enum LicenseType {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum VehicleType {
  COCHE = 'coche',
  MOTO = 'moto',
  CAMION = 'camion',
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  tipoPermiso: LicenseType;
  permisoValidoHasta: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipo: VehicleType;
  propietarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

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
