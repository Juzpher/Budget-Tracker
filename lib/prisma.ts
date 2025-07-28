import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Optional: Add error handling
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    console.error("Prisma Error:", error);
    throw error;
  }
});
