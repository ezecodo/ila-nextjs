import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"], // 🔍 Logs detallados para depuración
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

const prisma = globalForPrisma.prisma;

// 🔥 Función para cerrar conexiones inactivas
async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log("🛑 Prisma desconectado.");
  } catch (error) {
    console.error("⚠️ Error al desconectar Prisma:", error);
  }
}

// 🛠 Manejo de eventos para cerrar Prisma al terminar procesos
process.on("beforeExit", disconnectPrisma);
process.on("SIGINT", disconnectPrisma);
process.on("SIGTERM", disconnectPrisma);

export { prisma };
