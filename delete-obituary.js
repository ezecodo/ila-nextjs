import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteObituaries() {
  try {
    // Elimina primero los detalles de las necrológicas
    const deletedDetails = await prisma.obituaryDetails.deleteMany({});
    console.log(`${deletedDetails.count} detalles de necrológicas eliminados.`);

    // Luego elimina los artículos asociados a necrológicas
    const deletedArticles = await prisma.article.deleteMany({
      where: {
        obituaryDetails: {
          isNot: null, // Solo elimina los artículos que tienen detalles de necrológicas
        },
      },
    });
    console.log(`${deletedArticles.count} artículos de necrológicas eliminados.`);
  } catch (error) {
    console.error("Error al eliminar necrológicas:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecuta el script
deleteObituaries();
