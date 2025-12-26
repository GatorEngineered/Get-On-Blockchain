// scripts/seed-test-data.ts
// Run with: npx tsx scripts/seed-test-data.ts

import { PrismaClient, Business } from '@prisma/client';
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

  // 2. Create Business Locations (actual physical stores)
  const locations = [
    {
      slug: 'test-coffee-shop-downtown',
      name: 'Test Coffee Shop',
      locationNickname: 'Downtown',
      address: '123 Main St, Tampa, FL 33602',
      contactEmail: 'downtown@testcoffee.com',
    },
    {
      slug: 'test-coffee-shop-airport',
      name: 'Test Coffee Shop',
      locationNickname: 'Airport',
      address: '4100 George J Bean Pkwy, Tampa, FL 33607',
      contactEmail: 'airport@testcoffee.com',
    },
    {
      slug: 'test-coffee-shop-beach',
      name: 'Test Coffee Shop',
      locationNickname: 'Beach',
      address: '456 Beach Blvd, Clearwater, FL 33767',
      contactEmail: 'beach@testcoffee.com',
    },
  ];

  console.log('✅ Creating business locations...');
  const businesses: Business[] = [];
  for (const locationData of locations) {
    const business = await prisma.business.upsert({
      where: { slug: locationData.slug },
      update: {},
      create: {
        ...locationData,
        merchantId: merchant.id,
      },
    });
    businesses.push(business);
    console.log(`   📍 ${business.name} - ${business.locationNickname} (${business.address})`);
  }
  console.log();

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

  console.log('✅ Creating test members and linking to locations...');
  for (let i = 0; i < testMembers.length; i++) {
    const memberData = testMembers[i];
    const member = await prisma.member.upsert({
      where: { email: memberData.email },
      update: {},
      create: {
        ...memberData,
        tier: 'BASE',
      },
    });

    // Link member to one or more locations with different points
    const locationToLink = businesses[i % businesses.length]; // Distribute members across locations
    const randomPoints = Math.floor(Math.random() * 100);

    await prisma.businessMember.upsert({
      where: {
        businessId_memberId: {
          businessId: locationToLink.id,
          memberId: member.id,
        },
      },
      update: {},
      create: {
        businessId: locationToLink.id,
        memberId: member.id,
        points: randomPoints,
        walletAddress: null,
        walletNetwork: null,
      },
    });

    console.log(`   - ${member.firstName} ${member.lastName} → ${locationToLink.locationNickname} (${randomPoints} points)`);
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

  console.log('3️⃣  CUSTOMER SCAN URLS (QR Codes for each location):');
  businesses.forEach((business) => {
    console.log(`    📍 ${business.locationNickname}: http://localhost:3000/m/${business.slug}/claim`);
  });
  console.log('    📱 Each location gets a unique QR code!\n');

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
