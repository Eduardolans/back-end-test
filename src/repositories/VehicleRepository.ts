import { PrismaClient, Vehicle, User } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma';
import {
  CreateVehicleDTO,
  PaginationOptions,
  PaginatedResult,
} from '../models/types';

export type VehicleWithOwner = Vehicle & {
  propietario: User;
};

export class VehicleRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  public async create(data: CreateVehicleDTO): Promise<Vehicle> {
    return await this.prisma.vehicle.create({
      data: {
        marca: data.marca,
        modelo: data.modelo,
        matricula: data.matricula,
        tipo: data.tipo,
        propietarioId: data.propietario_id,
      },
    });
  }

  public async findById(id: string): Promise<Vehicle | null> {
    return await this.prisma.vehicle.findUnique({
      where: { id },
    });
  }

  public async findByMatricula(matricula: string): Promise<Vehicle | null> {
    return await this.prisma.vehicle.findUnique({
      where: { matricula },
    });
  }

  public async findByOwner(propietarioId: string): Promise<Vehicle[]> {
    return await this.prisma.vehicle.findMany({
      where: { propietarioId },
    });
  }

  public async updateOwner(id: string, newOwnerId: string): Promise<Vehicle> {
    return await this.prisma.vehicle.update({
      where: { id },
      data: { propietarioId: newOwnerId },
    });
  }

  public async findAll(): Promise<Vehicle[]> {
    return await this.prisma.vehicle.findMany();
  }

  public async findAllPaginated(
    options: PaginationOptions
  ): Promise<PaginatedResult<Vehicle>> {
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip,
        take: options.limit,
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

  public async findByIdWithOwner(
    id: string
  ): Promise<VehicleWithOwner | null> {
    return await this.prisma.vehicle.findUnique({
      where: { id },
      include: { propietario: true },
    });
  }

  public async createWithOwner(
    data: CreateVehicleDTO
  ): Promise<VehicleWithOwner> {
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

  public async updateOwnerAndGet(
    id: string,
    newOwnerId: string
  ): Promise<VehicleWithOwner> {
    return await this.prisma.vehicle.update({
      where: { id },
      data: { propietarioId: newOwnerId },
      include: { propietario: true },
    });
  }

  public async findAllWithOwner(): Promise<VehicleWithOwner[]> {
    return await this.prisma.vehicle.findMany({
      include: { propietario: true },
    });
  }

  public async findAllPaginatedWithOwner(
    options: PaginationOptions
  ): Promise<PaginatedResult<VehicleWithOwner>> {
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

  public async findByOwnerWithOwner(
    propietarioId: string
  ): Promise<VehicleWithOwner[]> {
    return await this.prisma.vehicle.findMany({
      where: { propietarioId },
      include: { propietario: true },
    });
  }
}
