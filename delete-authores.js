import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllAuthors() {
  try {
    const confirmation = await askConfirmation();
    if (confirmation.toLowerCase() === "yes") {
      const deleted = await prisma.author.deleteMany();
      console.log(`Se han eliminado ${deleted.count} autores.`);
    } else {
      console.log("Operación cancelada. No se eliminaron autores.");
    }
  } catch (error) {
    console.error("Error al eliminar autores:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para solicitar confirmación
async function askConfirmation() {
  return new Promise((resolve) => {
    console.log(
      '¿Estás seguro de que deseas eliminar todos los autores? Escribe "YES" para confirmar.'
    );
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", function (data) {
      process.stdin.pause();
      resolve(data.trim());
    });
  });
}

// Ejecutar la función
deleteAllAuthors().catch((e) => {
  console.error("Error general en el script:", e);
  process.exit(1);
});
