import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // 🔍 Logs detallados
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 🛠 Función para cerrar conexiones al terminar procesos
async function disconnectPrisma() {
  await prisma.$disconnect();
  console.log("🛑 Prisma desconectado.");
}

// 🔥 Cerrar Prisma cuando Node.js termine
process.on("beforeExit", disconnectPrisma);
process.on("SIGINT", disconnectPrisma);
process.on("SIGTERM", disconnectPrisma);

export { prisma };
