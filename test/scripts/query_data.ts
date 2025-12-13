import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // consulta de todos los usuarios
  const users = await prisma.user.findMany({
    include: { ownedVehicles: true },
  });
  console.log(JSON.stringify(users, null, 2));

  // consulta de todos los veh√≠culos
  const vehicles = await prisma.vehicle.findMany();
  console.log(JSON.stringify(vehicles, null, 2));

  // consulta de un usuario por su id
  const user = await prisma.user.findUnique({
    where: { id: 'f6a7f563-4846-455a-b06e-43220a1ede8d' },
    include: { ownedVehicles: true },
  });
  console.log(JSON.stringify(user, null, 2));

  // consulta de un vehiculo por su id
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: '48dc49b4-cd88-4551-9033-c6695f35eb6e' },
  });
  console.log(JSON.stringify(vehicle, null, 2));

  // consulta de la cantidad de usuarios
  const count = await prisma.user.count();
  console.log(count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
