import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@getonblockchain.com';
  const newPassword = 'SuperAdmin123!'; // Your new password

  // Find the admin
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    console.log('❌ Admin not found with email:', email);
    return;
  }

  // Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update the password
  await prisma.admin.update({
    where: { email },
    data: { passwordHash },
  });

  console.log('✅ Password reset successfully!');
  console.log('');
  console.log('New login credentials:');
  console.log('  Email:', email);
  console.log('  Password:', newPassword);
  console.log('');
  console.log('You can now login at: http://localhost:3000/admin/login');
}

main()
  .catch((e) => {
    console.error('Error resetting password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
