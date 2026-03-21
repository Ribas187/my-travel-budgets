import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- User (travel owner) ---
  const owner = await prisma.user.upsert({
    where: { email: 'guilherme.ribas.tech@gmail.com' },
    update: {},
    create: {
      email: 'guilherme.ribas.tech@gmail.com',
      name: 'Guilherme Ribas',
    },
  });

  // --- Guest user (travel companion) ---
  const guest = await prisma.user.upsert({
    where: { email: 'ana.travel@example.com' },
    update: {},
    create: {
      email: 'ana.travel@example.com',
      name: 'Ana Silva',
    },
  });

  // --- Travel 1: Japan Trip ---
  const japanTrip = await prisma.travel.upsert({
    where: { id: 'seed-japan-trip' },
    update: {},
    create: {
      id: 'seed-japan-trip',
      name: 'Japan Adventure',
      description: 'Two weeks exploring Tokyo, Kyoto, and Osaka',
      currency: 'JPY',
      budget: 500000,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-15'),
      createdById: owner.id,
    },
  });

  // --- Travel 2: Portugal Trip ---
  const portugalTrip = await prisma.travel.upsert({
    where: { id: 'seed-portugal-trip' },
    update: {},
    create: {
      id: 'seed-portugal-trip',
      name: 'Portugal Road Trip',
      description: 'Lisbon, Porto, and the Algarve coast',
      currency: 'EUR',
      budget: 3000,
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-07-20'),
      createdById: owner.id,
    },
  });

  // --- Members ---
  const ownerJapanMember = await prisma.travelMember.upsert({
    where: { travelId_userId: { travelId: japanTrip.id, userId: owner.id } },
    update: {},
    create: {
      travelId: japanTrip.id,
      userId: owner.id,
      role: 'owner',
    },
  });

  const guestJapanMember = await prisma.travelMember.upsert({
    where: { travelId_userId: { travelId: japanTrip.id, userId: guest.id } },
    update: {},
    create: {
      travelId: japanTrip.id,
      userId: guest.id,
      role: 'member',
    },
  });

  const ownerPortugalMember = await prisma.travelMember.upsert({
    where: { travelId_userId: { travelId: portugalTrip.id, userId: owner.id } },
    update: {},
    create: {
      travelId: portugalTrip.id,
      userId: owner.id,
      role: 'owner',
    },
  });

  // Guest member (no user account)
  const guestOnlyMember = await prisma.travelMember.create({
    data: {
      id: 'seed-guest-member',
      travelId: portugalTrip.id,
      guestName: 'Carlos (friend)',
      role: 'member',
    },
  }).catch(() =>
    prisma.travelMember.findUnique({ where: { id: 'seed-guest-member' } })
  );

  // --- Categories (Japan) ---
  const japanFood = await prisma.category.upsert({
    where: { id: 'seed-japan-food' },
    update: {},
    create: {
      id: 'seed-japan-food',
      travelId: japanTrip.id,
      name: 'Food & Drinks',
      budgetLimit: 150000,
      icon: 'utensils',
      color: '#FF6B35',
    },
  });

  const japanTransport = await prisma.category.upsert({
    where: { id: 'seed-japan-transport' },
    update: {},
    create: {
      id: 'seed-japan-transport',
      travelId: japanTrip.id,
      name: 'Transport',
      budgetLimit: 100000,
      icon: 'train',
      color: '#4ECDC4',
    },
  });

  const japanAccommodation = await prisma.category.upsert({
    where: { id: 'seed-japan-accommodation' },
    update: {},
    create: {
      id: 'seed-japan-accommodation',
      travelId: japanTrip.id,
      name: 'Accommodation',
      budgetLimit: 200000,
      icon: 'bed',
      color: '#7B68EE',
    },
  });

  const japanActivities = await prisma.category.upsert({
    where: { id: 'seed-japan-activities' },
    update: {},
    create: {
      id: 'seed-japan-activities',
      travelId: japanTrip.id,
      name: 'Activities',
      budgetLimit: 50000,
      icon: 'ticket',
      color: '#F7DC6F',
    },
  });

  // --- Categories (Portugal) ---
  const portugalFood = await prisma.category.upsert({
    where: { id: 'seed-portugal-food' },
    update: {},
    create: {
      id: 'seed-portugal-food',
      travelId: portugalTrip.id,
      name: 'Food & Drinks',
      budgetLimit: 800,
      icon: 'utensils',
      color: '#FF6B35',
    },
  });

  const portugalTransport = await prisma.category.upsert({
    where: { id: 'seed-portugal-transport' },
    update: {},
    create: {
      id: 'seed-portugal-transport',
      travelId: portugalTrip.id,
      name: 'Transport',
      budgetLimit: 500,
      icon: 'car',
      color: '#4ECDC4',
    },
  });

  const portugalAccommodation = await prisma.category.upsert({
    where: { id: 'seed-portugal-accommodation' },
    update: {},
    create: {
      id: 'seed-portugal-accommodation',
      travelId: portugalTrip.id,
      name: 'Accommodation',
      budgetLimit: 1200,
      icon: 'bed',
      color: '#7B68EE',
    },
  });

  const portugalActivities = await prisma.category.upsert({
    where: { id: 'seed-portugal-activities' },
    update: {},
    create: {
      id: 'seed-portugal-activities',
      travelId: portugalTrip.id,
      name: 'Activities',
      icon: 'ticket',
      color: '#F7DC6F',
    },
  });

  // --- Expenses (Japan) ---
  const japanExpenses = [
    { categoryId: japanFood.id, memberId: ownerJapanMember.id, amount: 3500, description: 'Ramen at Ichiran Shibuya', date: '2026-05-02' },
    { categoryId: japanFood.id, memberId: guestJapanMember.id, amount: 5200, description: 'Sushi omakase dinner', date: '2026-05-03' },
    { categoryId: japanFood.id, memberId: ownerJapanMember.id, amount: 1800, description: 'Convenience store snacks', date: '2026-05-04' },
    { categoryId: japanTransport.id, memberId: ownerJapanMember.id, amount: 29110, description: 'JR Pass 7 days', date: '2026-05-01' },
    { categoryId: japanTransport.id, memberId: ownerJapanMember.id, amount: 2500, description: 'Suica card top-up', date: '2026-05-02' },
    { categoryId: japanAccommodation.id, memberId: ownerJapanMember.id, amount: 12000, description: 'Hotel in Shinjuku (per night)', date: '2026-05-01' },
    { categoryId: japanAccommodation.id, memberId: ownerJapanMember.id, amount: 8500, description: 'Ryokan in Kyoto', date: '2026-05-06' },
    { categoryId: japanActivities.id, memberId: guestJapanMember.id, amount: 2000, description: 'Fushimi Inari shrine tour', date: '2026-05-07' },
    { categoryId: japanActivities.id, memberId: ownerJapanMember.id, amount: 6500, description: 'TeamLab Borderless tickets', date: '2026-05-04' },
  ];

  // --- Expenses (Portugal) ---
  const portugalExpenses = [
    { categoryId: portugalFood.id, memberId: ownerPortugalMember.id, amount: 35, description: 'Pastéis de Belém & coffee', date: '2026-07-10' },
    { categoryId: portugalFood.id, memberId: ownerPortugalMember.id, amount: 65, description: 'Seafood dinner in Cascais', date: '2026-07-11' },
    { categoryId: portugalFood.id, memberId: guestOnlyMember?.id ?? null, amount: 28, description: 'Port wine tasting in Porto', date: '2026-07-14' },
    { categoryId: portugalTransport.id, memberId: ownerPortugalMember.id, amount: 180, description: 'Car rental (5 days)', date: '2026-07-12' },
    { categoryId: portugalTransport.id, memberId: ownerPortugalMember.id, amount: 45, description: 'Fuel', date: '2026-07-15' },
    { categoryId: portugalAccommodation.id, memberId: ownerPortugalMember.id, amount: 95, description: 'Airbnb Lisbon (per night)', date: '2026-07-10' },
    { categoryId: portugalAccommodation.id, memberId: ownerPortugalMember.id, amount: 110, description: 'Hotel in Porto', date: '2026-07-13' },
    { categoryId: portugalActivities.id, memberId: ownerPortugalMember.id, amount: 25, description: 'Sintra Palace entry', date: '2026-07-12' },
  ];

  for (const expense of [...japanExpenses, ...portugalExpenses]) {
    await prisma.expense.create({
      data: {
        travelId: expense.categoryId.startsWith('seed-japan') ? japanTrip.id : portugalTrip.id,
        categoryId: expense.categoryId,
        memberId: expense.memberId,
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date),
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log(`  - 2 users (owner: ${owner.email})`);
  console.log(`  - 2 travels (Japan, Portugal)`);
  console.log(`  - 4 members across travels`);
  console.log(`  - 8 categories`);
  console.log(`  - ${japanExpenses.length + portugalExpenses.length} expenses`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
