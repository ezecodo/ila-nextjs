import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Insertando categorías en PersonCategory...");

  // Categorías a insertar
  const categories = [
    { name: "Autor*in" },
    { name: "Redaktionsmitglied" },
    { name: "Ständige Mitarbeiter*in" },
  ];

  for (const category of categories) {
    try {
      // Usamos upsert para evitar duplicados
      await prisma.personCategory.upsert({
        where: { name: category.name },
        update: {}, // No se realiza ninguna actualización
        create: category, // Solo se crea si no existe
      });
      console.log(`Categoría '${category.name}' insertada o ya existía.`);
    } catch (error) {
      console.error(`Error al insertar '${category.name}':`, error);
    }
  }

  console.log("Proceso completado.");
}

main()
  .catch((e) => {
    console.error("Error general en el script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
