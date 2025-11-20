import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "development") {
  console.log(
    "Prisma DATABASE_URL (first 80 chars):",
    process.env.DATABASE_URL?.slice(0, 80)
  );
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
