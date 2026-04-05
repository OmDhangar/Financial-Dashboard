// prisma/seed.ts
import { PrismaClient, Role, RecordType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // --- Clean existing data (optional but ensures predictable results) ---
  console.log('🗑️ Cleaning database...');
  await prisma.record.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { notIn: ['admin@company.com', 'analyst@company.com', 'viewer@company.com'] } } });

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

  const categoryMap: Record<string, any> = {};
  categories.forEach(c => categoryMap[c.name] = c);

  // --- Users ---
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { status: 'ACTIVE' },
    create: { email: 'admin@company.com', name: 'Admin User', passwordHash, role: Role.ADMIN },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@company.com' },
    update: { status: 'ACTIVE' },
    create: { email: 'analyst@company.com', name: 'Analyst User', passwordHash, role: Role.ANALYST },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@company.com' },
    update: { status: 'ACTIVE' },
    create: { email: 'viewer@company.com', name: 'Viewer User', passwordHash, role: Role.VIEWER },
  });

  const users = [admin, analyst, viewer];
  console.log(`✅ ${users.length} users seeded`);

  // --- Financial Records ---
  const now = new Date();
  let recordCount = 0;

  const records = [
    // --- Admin Records ---
    { amount: 5000, type: RecordType.INCOME, categoryId: categoryMap['Salary'].id, date: new Date(now.getFullYear(), now.getMonth(), 1), notes: 'Admin Monthly Salary', createdById: admin.id },
    { amount: 1200, type: RecordType.EXPENSE, categoryId: categoryMap['Rent'].id, date: new Date(now.getFullYear(), now.getMonth(), 2), notes: 'Admin Rent Payment', createdById: admin.id },
    { amount: 150, type: RecordType.EXPENSE, categoryId: categoryMap['Utilities'].id, date: new Date(now.getFullYear(), now.getMonth(), 5), notes: 'Admin Utilities', createdById: admin.id },
    { amount: 300, type: RecordType.EXPENSE, categoryId: categoryMap['Food'].id, date: new Date(now.getFullYear(), now.getMonth(), 10), notes: 'Admin Groceries', createdById: admin.id },
    
    // --- Analyst Records ---
    { amount: 4500, type: RecordType.INCOME, categoryId: categoryMap['Salary'].id, date: new Date(now.getFullYear(), now.getMonth(), 1), notes: 'Analyst Monthly Salary', createdById: analyst.id },
    { amount: 1000, type: RecordType.EXPENSE, categoryId: categoryMap['Rent'].id, date: new Date(now.getFullYear(), now.getMonth(), 2), notes: 'Analyst Rent Payment', createdById: analyst.id },
    { amount: 800, type: RecordType.INCOME, categoryId: categoryMap['Freelance'].id, date: new Date(now.getFullYear(), now.getMonth(), 14), notes: 'Analyst Gig Project', createdById: analyst.id },
    { amount: 200, type: RecordType.EXPENSE, categoryId: categoryMap['Transport'].id, date: new Date(now.getFullYear(), now.getMonth(), 12), notes: 'Analyst Commute', createdById: analyst.id },
    { amount: 450, type: RecordType.EXPENSE, categoryId: categoryMap['Food'].id, date: new Date(now.getFullYear(), now.getMonth(), 18), notes: 'Analyst Dining', createdById: analyst.id },
    { amount: 120, type: RecordType.EXPENSE, categoryId: categoryMap['Entertainment'].id, date: new Date(now.getFullYear(), now.getMonth(), 20), notes: 'Analyst Netflix + Games', createdById: analyst.id },

    // --- Viewer Records ---
    { amount: 3800, type: RecordType.INCOME, categoryId: categoryMap['Salary'].id, date: new Date(now.getFullYear(), now.getMonth(), 1), notes: 'Viewer Monthly Salary', createdById: viewer.id },
    { amount: 800, type: RecordType.EXPENSE, categoryId: categoryMap['Rent'].id, date: new Date(now.getFullYear(), now.getMonth(), 2), notes: 'Viewer Rent Payment', createdById: viewer.id },
    { amount: 180, type: RecordType.EXPENSE, categoryId: categoryMap['Transport'].id, date: new Date(now.getFullYear(), now.getMonth(), 15), notes: 'Viewer Fuel', createdById: viewer.id },
    { amount: 250, type: RecordType.EXPENSE, categoryId: categoryMap['Food'].id, date: new Date(now.getFullYear(), now.getMonth(), 12), notes: 'Viewer Bulk Groceries', createdById: viewer.id },
    { amount: 50, type: RecordType.EXPENSE, categoryId: categoryMap['Healthcare'].id, date: new Date(now.getFullYear(), now.getMonth(), 22), notes: 'Viewer Pharmacy', createdById: viewer.id },
  ];

  for (const recordData of records) {
    await prisma.record.create({ data: recordData });
    recordCount++;
  }

  // --- Historical Data (Last Month) ---
  for (const user of users) {
    await prisma.record.create({
      data: {
        amount: Math.floor(Math.random() * 2000) + 3000,
        type: RecordType.INCOME,
        categoryId: categoryMap['Salary'].id,
        date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        notes: `${user.name} Previous Month Salary`,
        createdById: user.id
      }
    });
    recordCount++;
  }

  console.log(`✅ ${recordCount} financial records seeded across multiple users and periods`);
  console.log('\n🎉 Seed complete!');
  console.log('  Accounts: admin@company.com, analyst@company.com, viewer@company.com');
  console.log('  Default Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
