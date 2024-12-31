import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixCoverImagePaths() {
  console.log("Corrigiendo rutas de imágenes en la base de datos...");

  try {
    // Obtener todas las ediciones con rutas de imagen que necesitan corrección
    const editions = await prisma.edition.findMany({
      where: {
        coverImage: { startsWith: "uploads/" }, // Identificar rutas sin barra inicial
      },
      select: {
        id: true,
        number: true,
        coverImage: true,
      },
    });

    if (editions.length === 0) {
      console.log("No se encontraron rutas de imagen para corregir.");
      return;
    }

    for (const edition of editions) {
      const correctedPath = `/${edition.coverImage}`; // Agregar la barra inicial

      // Actualizar la ruta en la base de datos
      await prisma.edition.update({
        where: { id: edition.id },
        data: { coverImage: correctedPath },
      });

      console.log(
        `Ruta corregida para la edición ${edition.number}: ${correctedPath}`
      );
    }

    console.log("\x1b[36m");
    console.log(`
        ███████╗███████╗███████╗
        ██╔════╝╚════██║██╔════╝
        █████╗░░░░███╔═╝█████╗░░
        ██╔══╝░░██╔══╝░░██╔══╝░░
        ███████╗███████╗███████╗
        ╚══════╝╚══════╝╚══════╝   
                         
                   
      Rutas de imágenes corregidas exitosamente!
      `);
    console.log("\x1b[0m");
  } catch (error) {
    console.error("Error al corregir las rutas de imágenes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCoverImagePaths().catch((e) => {
  console.error("Error general en el script:", e);
  process.exit(1);
});
