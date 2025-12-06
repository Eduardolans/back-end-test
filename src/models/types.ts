import { LicenseType, VehicleType, User, Vehicle } from '@prisma/client';

export { LicenseType, VehicleType, User, Vehicle };

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
