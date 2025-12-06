import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  await prisma.ownershipHistory.deleteMany();
  await prisma.authorizedDriver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);

  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);

  const user1 = await prisma.user.create({
    data: {
      nombre: 'Juan Pérez',
      email: 'juan.perez@example.com',
      tipoPermiso: 'B',
      permisoValidoHasta: futureDate,
    },
  });
  console.log('✅ Created user:', user1.nombre, `(ID: ${user1.id})`);

  const user2 = await prisma.user.create({
    data: {
      nombre: 'María García',
      email: 'maria.garcia@example.com',
      tipoPermiso: 'A',
      permisoValidoHasta: futureDate,
    },
  });
  console.log('✅ Created user:', user2.nombre, `(ID: ${user2.id})`);

  const user3 = await prisma.user.create({
    data: {
      nombre: 'Carlos López',
      email: 'carlos.lopez@example.com',
      tipoPermiso: 'C',
      permisoValidoHasta: futureDate,
    },
  });
  console.log('✅ Created user:', user3.nombre, `(ID: ${user3.id})`);

  const user4 = await prisma.user.create({
    data: {
      nombre: 'Ana Martínez',
      email: 'ana.martinez@example.com',
      tipoPermiso: 'B',
      permisoValidoHasta: pastDate,
    },
  });
  console.log('✅ Created user:', user4.nombre, `(ID: ${user4.id}) - EXPIRED`);

  const user5 = await prisma.user.create({
    data: {
      nombre: 'Pedro González',
      email: 'pedro.gonzalez@example.com',
      tipoPermiso: 'B',
      permisoValidoHasta: futureDate,
    },
  });
  console.log('✅ Created user:', user5.nombre, `(ID: ${user5.id})`);

  const vehicle1 = await prisma.vehicle.create({
    data: {
      marca: 'Toyota',
      modelo: 'Corolla',
      matricula: '1234ABC',
      tipo: 'coche',
      propietarioId: user1.id,
    },
  });
  console.log('✅ Created vehicle:', vehicle1.marca, vehicle1.modelo);

  const vehicle2 = await prisma.vehicle.create({
    data: {
      marca: 'Honda',
      modelo: 'CBR 600',
      matricula: '5678XYZ',
      tipo: 'moto',
      propietarioId: user2.id,
    },
  });
  console.log('✅ Created vehicle:', vehicle2.marca, vehicle2.modelo);

  const vehicle3 = await prisma.vehicle.create({
    data: {
      marca: 'Mercedes',
      modelo: 'Actros',
      matricula: '9012DEF',
      tipo: 'camion',
      propietarioId: user3.id,
    },
  });
  console.log('✅ Created vehicle:', vehicle3.marca, vehicle3.modelo);

  console.log('\n📋 Test Data Summary:');
  console.log('==========================================');
  console.log(`User 1: ${user1.nombre} (${user1.id})`);
  console.log(`  - Email: ${user1.email}`);
  console.log(`  - License: Type B (Valid until ${futureDate.toISOString().split('T')[0]})`);
  console.log(`  - Vehicle: ${vehicle1.marca} ${vehicle1.modelo} (${vehicle1.matricula})`);
  console.log('');
  console.log(`User 2: ${user2.nombre} (${user2.id})`);
  console.log(`  - Email: ${user2.email}`);
  console.log(`  - License: Type A (Valid until ${futureDate.toISOString().split('T')[0]})`);
  console.log(`  - Vehicle: ${vehicle2.marca} ${vehicle2.modelo} (${vehicle2.matricula})`);
  console.log('');
  console.log(`User 3: ${user3.nombre} (${user3.id})`);
  console.log(`  - Email: ${user3.email}`);
  console.log(`  - License: Type C (Valid until ${futureDate.toISOString().split('T')[0]})`);
  console.log(`  - Vehicle: ${vehicle3.marca} ${vehicle3.modelo} (${vehicle3.matricula})`);
  console.log('');
  console.log(`User 4: ${user4.nombre} (${user4.id})`);
  console.log(`  - Email: ${user4.email}`);
  console.log(
    `  - License: Type B (EXPIRED - ${pastDate.toISOString().split('T')[0]})`
  );
  console.log('  - No vehicles');
  console.log('');
  console.log(`User 5: ${user5.nombre} (${user5.id})`);
  console.log(`  - Email: ${user5.email}`);
  console.log(`  - License: Type B (Valid until ${futureDate.toISOString().split('T')[0]})`);
  console.log('  - No vehicles');
  console.log('==========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
