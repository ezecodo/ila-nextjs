const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Eliminando datos de Beitragssubtyp...");
  await prisma.beitragssubtyp.deleteMany();
  console.log("Tabla Beitragssubtyp limpiada.");

  console.log("Eliminando datos de Beitragstyp...");
  await prisma.beitragstyp.deleteMany();
  console.log("Tabla Beitragstyp limpiada.");

  console.log("Limpieza completada.");
}

main()
  .catch((e) => {
    console.error("Error durante la limpieza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
