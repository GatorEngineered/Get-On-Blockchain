import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@getonblockchain.com';
  const password = 'SuperAdmin123!'; // Change this to your desired password

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('⚠️  Super Admin already exists with email:', email);
    console.log('If you want to reset the password, delete the existing admin first in Prisma Studio.');
    return;
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create the super admin
  const admin = await prisma.admin.create({
    data: {
      email: email,
      passwordHash: passwordHash,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin created successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email:', admin.email);
  console.log('  Password:', password);
  console.log('');
  console.log('You can now login at: http://localhost:3000/admin/login');
  console.log('');
  console.log('⚠️  IMPORTANT: Change your password after first login!');
}

main()
  .catch((e) => {
    console.error('Error creating super admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
