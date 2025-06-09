import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ["warn", "error"], // "query" e "info" solo si necesitas más debug
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

const prisma = globalForPrisma.prisma;

// ✅ Solo activa el cierre de conexiones en entornos NO serverless
if (
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "local"
) {
  async function disconnectPrisma() {
    try {
      await prisma.$disconnect();
      console.log("🛑 Prisma desconectado.");
    } catch (error) {
      console.error("⚠️ Error al desconectar Prisma:", error);
    }
  }

  process.on("beforeExit", disconnectPrisma);
  process.on("SIGINT", disconnectPrisma);
  process.on("SIGTERM", disconnectPrisma);
}

export { prisma };
