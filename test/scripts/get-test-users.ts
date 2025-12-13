import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTestUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'juan.perez@example.com',
          'maria.garcia@example.com',
          'carlos.lopez@example.com',
          'ana.martinez@example.com',
          'pedro.gonzalez@example.com',
        ],
      },
    },
    orderBy: { email: 'asc' },
  });

  const userMap: Record<string, string> = {};
  users.forEach((user) => {
    if (user.email === 'juan.perez@example.com') userMap.USER1_ID = user.id;
    if (user.email === 'maria.garcia@example.com') userMap.USER2_ID = user.id;
    if (user.email === 'carlos.lopez@example.com') userMap.USER3_ID = user.id;
    if (user.email === 'ana.martinez@example.com') userMap.USER4_ID = user.id;
    if (user.email === 'pedro.gonzalez@example.com') userMap.USER5_ID = user.id;
  });

  const vehicle = await prisma.vehicle.findFirst({
    where: { matricula: '1234ABC' },
  });

  if (vehicle !== null) {
    userMap.VEHICLE_ID = vehicle.id;
  }

  console.log(JSON.stringify(userMap));
  await prisma.$disconnect();
}

getTestUsers().catch(console.error);
