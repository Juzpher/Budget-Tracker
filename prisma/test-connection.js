const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const test = await prisma.userSettings.create({
      data: {
        userId: "test-user",
        currency: "USD",
      },
    });

    console.log("✅ Successfully connected and inserted data:");
    console.log(test);
  } catch (err) {
    console.error("❌ Failed to connect or insert:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
