import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prisma';
import { AuthorizedDriverData } from './types';

export class AuthorizedDriverRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  public async addDriver(
    vehicleId: string,
    userId: string
  ): Promise<AuthorizedDriverData> {
    return await this.prisma.authorizedDriver.create({
      data: {
        vehicleId,
        userId,
      },
      include: { user: true },
    });
  }

  public async findByVehicle(
    vehicleId: string
  ): Promise<AuthorizedDriverData[]> {
    return await this.prisma.authorizedDriver.findMany({
      where: { vehicleId },
      include: { user: true },
    });
  }

  public async removeDriver(
    vehicleId: string,
    userId: string
  ): Promise<{ count: number }> {
    return await this.prisma.authorizedDriver.deleteMany({
      where: {
        vehicleId,
        userId,
      },
    });
  }
}
