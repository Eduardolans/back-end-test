import { AuthorizedDriver, User } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma';

export type AuthorizedDriverWithUser = AuthorizedDriver & {
  user: User;
};

export class AuthorizedDriverRepository {
  private prisma = getPrismaClient();

  public async addDriver(
    vehicleId: string,
    userId: string
  ): Promise<AuthorizedDriver> {
    return await this.prisma.authorizedDriver.create({
      data: {
        vehicleId,
        userId,
      },
    });
  }

  public async addDriverWithUser(
    vehicleId: string,
    userId: string
  ): Promise<AuthorizedDriverWithUser> {
    return await this.prisma.authorizedDriver.create({
      data: {
        vehicleId,
        userId,
      },
      include: { user: true },
    });
  }

  public async findByVehicle(vehicleId: string): Promise<AuthorizedDriver[]> {
    return await this.prisma.authorizedDriver.findMany({
      where: { vehicleId },
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
