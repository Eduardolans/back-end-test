import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prisma';
import {
  CreateVehicleData,
  PaginationOptionsData,
  PaginatedResultData,
  VehicleData,
} from './types';

export class VehicleRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  public async create(data: CreateVehicleData): Promise<VehicleData> {
    return await this.prisma.vehicle.create({
      data: {
        marca: data.marca,
        modelo: data.modelo,
        matricula: data.matricula,
        tipo: data.tipo,
        propietarioId: data.propietario_id,
      },
      include: { propietario: true },
    });
  }

  public async findById(id: string): Promise<VehicleData | null> {
    return await this.prisma.vehicle.findUnique({
      where: { id },
      include: { propietario: true },
    });
  }

  public async findByMatricula(matricula: string): Promise<VehicleData | null> {
    return await this.prisma.vehicle.findUnique({
      where: { matricula },
      include: { propietario: true },
    });
  }

  public async findByOwner(propietarioId: string): Promise<VehicleData[]> {
    return await this.prisma.vehicle.findMany({
      where: { propietarioId },
      include: { propietario: true },
    });
  }

  public async updateOwner(
    id: string,
    newOwnerId: string
  ): Promise<VehicleData> {
    return await this.prisma.vehicle.update({
      where: { id },
      data: { propietarioId: newOwnerId },
      include: { propietario: true },
    });
  }

  public async findAll(): Promise<VehicleData[]> {
    return await this.prisma.vehicle.findMany({
      include: { propietario: true },
    });
  }

  public async findAllPaginated(
    options: PaginationOptionsData
  ): Promise<PaginatedResultData<VehicleData>> {
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip,
        take: options.limit,
        include: { propietario: true },
      }),
      this.prisma.vehicle.count(),
    ]);

    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }
}
