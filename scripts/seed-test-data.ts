// scripts/seed-test-data.ts
// Run with: npx tsx scripts/seed-test-data.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...\n');

  // 1. Create a test merchant (SaaS customer / business owner)
  const passwordHash = await bcrypt.hash('password123', 10);

  const merchant = await prisma.merchant.upsert({
    where: { slug: 'test-coffee-shop' },
    update: {},
    create: {
      slug: 'test-coffee-shop',
      name: 'Test Coffee Shop',
      tagline: 'Best coffee in town!',
      loginEmail: 'owner@testcoffee.com',
      passwordHash,
      plan: 'BASIC',
      welcomePoints: 10,
      earnPerVisit: 10,
      vipThreshold: 100,
      primaryColor: '#6B4226',
      accentColor: '#D4A574',
    },
  });

  console.log('✅ Created Merchant:');
  console.log(`   Name: ${merchant.name}`);
  console.log(`   Slug: ${merchant.slug}`);
  console.log(`   Login: ${merchant.loginEmail}`);
  console.log(`   Password: password123`);
  console.log(`   Plan: ${merchant.plan}\n`);

  // 2. Create a Business (actual business entity)
  const business = await prisma.business.upsert({
    where: { slug: 'test-coffee-shop' },
    update: {},
    create: {
      slug: 'test-coffee-shop',
      name: 'Test Coffee Shop',
      contactEmail: 'hello@testcoffee.com',
    },
  });

  console.log('✅ Created Business:');
  console.log(`   Name: ${business.name}`);
  console.log(`   Slug: ${business.slug}\n`);

  // 3. Create a few test members (customers)
  const testMembers = [
    {
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '555-0100',
    },
    {
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Smith',
      phone: '555-0101',
    },
    {
      email: 'charlie@example.com',
      firstName: 'Charlie',
      lastName: 'Brown',
      phone: '555-0102',
    },
  ];

  console.log('✅ Creating test members...');
  for (const memberData of testMembers) {
    const member = await prisma.member.upsert({
      where: { email: memberData.email },
      update: {},
      create: {
        ...memberData,
        tier: 'BASE',
      },
    });

    // Link member to business with some points
    const randomPoints = Math.floor(Math.random() * 100);
    await prisma.businessMember.upsert({
      where: {
        businessId_memberId: {
          businessId: business.id,
          memberId: member.id,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        memberId: member.id,
        points: randomPoints,
        walletAddress: null,
        walletNetwork: null,
      },
    });

    console.log(`   - ${member.firstName} ${member.lastName} (${randomPoints} points)`);
  }

  console.log('\n🎉 Test data seeded successfully!\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TESTING INSTRUCTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1️⃣  START DEV SERVER:');
  console.log('    npm run dev\n');

  console.log('2️⃣  ACCESS MERCHANT DASHBOARD:');
  console.log('    URL: http://localhost:3000/dashboard');
  console.log('    (View your business stats and QR code)\n');

  console.log('3️⃣  CUSTOMER SCAN URL (QR Code):');
  console.log(`    URL: http://localhost:3000/m/${merchant.slug}/claim`);
  console.log('    📱 Share this URL or generate QR code for customers\n');

  console.log('4️⃣  TEST CUSTOMER JOURNEY:');
  console.log('    a) Visit customer scan URL');
  console.log('    b) Fill in customer info (first name, last name, email)');
  console.log('    c) Choose email or wallet mode');
  console.log('    d) Customer earns 10 points automatically!');
  console.log('    e) Check dashboard to see new member\n');

  console.log('5️⃣  MERCHANT LOGIN (if needed):');
  console.log('    URL: http://localhost:3000/login');
  console.log(`    Email: ${merchant.loginEmail}`);
  console.log('    Password: password123\n');

  console.log('6️⃣  VIEW MEMBERS:');
  console.log('    URL: http://localhost:3000/dashboard/members');
  console.log('    (See all customers and their points)\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
