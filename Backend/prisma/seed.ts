// prisma/seed.ts
import { PrismaClient, Role, RecordType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // --- Categories ---
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Salary' }, update: {}, create: { name: 'Salary' } }),
    prisma.category.upsert({ where: { name: 'Rent' }, update: {}, create: { name: 'Rent' } }),
    prisma.category.upsert({ where: { name: 'Utilities' }, update: {}, create: { name: 'Utilities' } }),
    prisma.category.upsert({ where: { name: 'Food' }, update: {}, create: { name: 'Food' } }),
    prisma.category.upsert({ where: { name: 'Transport' }, update: {}, create: { name: 'Transport' } }),
    prisma.category.upsert({ where: { name: 'Freelance' }, update: {}, create: { name: 'Freelance' } }),
    prisma.category.upsert({ where: { name: 'Entertainment' }, update: {}, create: { name: 'Entertainment' } }),
    prisma.category.upsert({ where: { name: 'Healthcare' }, update: {}, create: { name: 'Healthcare' } }),
  ]);
  console.log(`✅ ${categories.length} categories seeded`);

  const [salary, rent, utilities, food, transport, freelance, entertainment, healthcare] = categories;

  // --- Users ---
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      name: 'Admin User',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@company.com' },
    update: {},
    create: {
      email: 'analyst@company.com',
      name: 'Analyst User',
      passwordHash,
      role: Role.ANALYST,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@company.com' },
    update: {},
    create: {
      email: 'viewer@company.com',
      name: 'Viewer User',
      passwordHash,
      role: Role.VIEWER,
    },
  });

  console.log(`✅ 3 users seeded (admin / analyst / viewer — all password: Password123!)`);

  // --- Financial Records (past 6 months) ---
  const now = new Date();

  const records = [
    // Income
    { amount: 75000, type: RecordType.INCOME, categoryId: salary.id, date: new Date(now.getFullYear(), now.getMonth(), 1), notes: 'Monthly salary - March', createdById: admin.id },
    { amount: 75000, type: RecordType.INCOME, categoryId: salary.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), notes: 'Monthly salary - February', createdById: admin.id },
    { amount: 75000, type: RecordType.INCOME, categoryId: salary.id, date: new Date(now.getFullYear(), now.getMonth() - 2, 1), notes: 'Monthly salary - January', createdById: admin.id },
    { amount: 15000, type: RecordType.INCOME, categoryId: freelance.id, date: new Date(now.getFullYear(), now.getMonth(), 10), notes: 'Website redesign project', createdById: admin.id },
    { amount: 8500, type: RecordType.INCOME, categoryId: freelance.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), notes: 'API development contract', createdById: admin.id },
    // Expenses
    { amount: 25000, type: RecordType.EXPENSE, categoryId: rent.id, date: new Date(now.getFullYear(), now.getMonth(), 1), notes: 'Monthly rent', createdById: admin.id },
    { amount: 25000, type: RecordType.EXPENSE, categoryId: rent.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), notes: 'Monthly rent', createdById: admin.id },
    { amount: 25000, type: RecordType.EXPENSE, categoryId: rent.id, date: new Date(now.getFullYear(), now.getMonth() - 2, 1), notes: 'Monthly rent', createdById: admin.id },
    { amount: 3200, type: RecordType.EXPENSE, categoryId: utilities.id, date: new Date(now.getFullYear(), now.getMonth(), 5), notes: 'Electricity + Internet', createdById: admin.id },
    { amount: 8500, type: RecordType.EXPENSE, categoryId: food.id, date: new Date(now.getFullYear(), now.getMonth(), 15), notes: 'Monthly groceries + dining', createdById: admin.id },
    { amount: 4200, type: RecordType.EXPENSE, categoryId: transport.id, date: new Date(now.getFullYear(), now.getMonth(), 12), notes: 'Fuel + parking', createdById: admin.id },
    { amount: 2800, type: RecordType.EXPENSE, categoryId: entertainment.id, date: new Date(now.getFullYear(), now.getMonth(), 20), notes: 'Streaming + events', createdById: admin.id },
    { amount: 5500, type: RecordType.EXPENSE, categoryId: healthcare.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 8), notes: 'Health checkup + medications', createdById: admin.id },
  ];

  let recordCount = 0;
  for (const record of records) {
    await prisma.record.create({ data: record });
    recordCount++;
  }
  console.log(`✅ ${recordCount} financial records seeded`);

  // Suppress unused variable warnings
  void analyst;
  void viewer;

  console.log('\n🎉 Seed complete!');
  console.log('  Roles: admin@company.com | analyst@company.com | viewer@company.com');
  console.log('  Password for all: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
