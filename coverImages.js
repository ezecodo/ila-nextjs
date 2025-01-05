import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateCoverImages() {
  try {
    console.log("Actualizando rutas de imágenes...");

    // Obtener todas las ediciones
    const editions = await prisma.edition.findMany();

    for (const edition of editions) {
      const coverImage = `/uploads/editions-pics/ila${edition.number}_cover.jpg`;

      // Actualizar la columna `coverImage` con la ruta correcta
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
