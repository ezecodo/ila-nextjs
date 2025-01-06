import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateCoverImages() {
  try {
    console.log("Actualizando rutas de imágenes...");

    // Obtener todas las ediciones
    const editions = await prisma.edition.findMany();

    for (const edition of editions) {
      // Mantener el formato actual del nombre de las imágenes
      const coverImage = `/up/edi/ila${edition.number}_cover.jpg`;

      // Actualizar la columna `coverImage` con la nueva ruta
      await prisma.edition.update({
        where: { id: edition.id },
        data: { coverImage },
      });

      console.log(`Actualizado coverImage para edición ${edition.number}`);
    }

    console.log("Actualización completada.");
  } catch (error) {
    console.error("Error al actualizar las rutas de imágenes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCoverImages().catch((e) => {
  console.error("Error general en el script:", e);
  process.exit(1);
});
