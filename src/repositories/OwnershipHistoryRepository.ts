import { OwnershipHistory, User } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma';

export type OwnershipHistoryData = OwnershipHistory & {
  user: User;
};

export class OwnershipHistoryRepository {
  private prisma = getPrismaClient();

  public async create(
    vehicleId: string,
    userId: string
  ): Promise<OwnershipHistory> {
    return await this.prisma.ownershipHistory.create({
      data: {
        vehicleId,
        userId,
        fechaInicio: new Date(),
      },
    });
  }

  public async findByVehicle(
    vehicleId: string
  ): Promise<OwnershipHistoryData[]> {
    return await this.prisma.ownershipHistory.findMany({
      where: { vehicleId },
      orderBy: { fechaInicio: 'desc' },
      include: { user: true },
    });
  }

  public async closeCurrentOwnership(
    vehicleId: string,
    userId: string
  ): Promise<void> {
    await this.prisma.ownershipHistory.updateMany({
      where: {
        vehicleId,
        userId,
        fechaFin: null,
      },
      data: {
        fechaFin: new Date(),
      },
    });
  }
}
