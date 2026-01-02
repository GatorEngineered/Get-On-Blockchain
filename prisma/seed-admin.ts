import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // IMPORTANT: Change these values to your actual admin credentials
  const adminEmail = "admin@getonblockchain.com";
  const adminPassword = "ChangeMe123!"; // CHANGE THIS PASSWORD!
  const adminFullName = "Admin User";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      fullName: adminFullName,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin user created/updated:");
  console.log("   Email:", admin.email);
  console.log("   Role:", admin.role);
  console.log("   ID:", admin.id);
  console.log("\n⚠️  IMPORTANT: Change the default password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
