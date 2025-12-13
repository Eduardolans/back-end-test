import { PrismaClient, User } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma';
import { PaginationOptions, PaginatedResult } from '../models/types';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  public async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  public async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  public async findAllPaginated(
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: options.limit,
      }),
      this.prisma.user.count(),
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
