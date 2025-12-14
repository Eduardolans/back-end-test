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

  // Get vehicles
  const vehicle1 = await prisma.vehicle.findFirst({
    where: { matricula: '1234ABC' },
  });

  const vehicle2 = await prisma.vehicle.findFirst({
    where: { matricula: '5678XYZ' },
  });

  const vehicle3 = await prisma.vehicle.findFirst({
    where: { matricula: '9012DEF' },
  });

  if (vehicle1 !== null) {
    userMap.VEHICLE_ID = vehicle1.id;
    userMap.VEHICLE1_ID = vehicle1.id;
  }

  if (vehicle2 !== null) {
    userMap.VEHICLE2_ID = vehicle2.id;
  }

  if (vehicle3 !== null) {
    userMap.VEHICLE3_ID = vehicle3.id;
  }

  // Get an authorized driver for vehicle1
  const authorizedDriver = await prisma.authorizedDriver.findFirst({
    where: { vehicleId: vehicle1?.id },
    include: { user: true },
  });

  if (authorizedDriver !== null) {
    userMap.AUTHORIZED_DRIVER_ID = authorizedDriver.userId;
  }

  console.log(JSON.stringify(userMap));
  await prisma.$disconnect();
}

getTestUsers().catch(console.error);
