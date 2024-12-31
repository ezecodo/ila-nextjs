import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function processImages() {
  const basePath = path.resolve("public/uploads/editions-pics");
  console.log("Obteniendo ediciones desde la base de datos...");

  const editions = await prisma.edition.findMany({
    select: { id: true, number: true },
  });

  for (const edition of editions) {
    const { id, number } = edition;

    // Buscar el archivo que contenga el número en su nombre
    const files = fs.readdirSync(basePath);
    const matchedFile = files.find((file) => file.includes(number.toString()));

    if (matchedFile) {
      // Ruta actual y nueva del archivo
      const oldPath = path.join(basePath, matchedFile);
      const newFileName = `Ila${number}_cover.jpg`;
      const newPath = path.join(basePath, newFileName);

      try {
        // Renombrar el archivo
        fs.renameSync(oldPath, newPath);

        // Ruta relativa para guardar en la base de datos
        const relativePath = `uploads/editions-pics/${newFileName}`;

        // Actualizar la base de datos
        await prisma.edition.update({
          where: { id },
          data: { coverImage: relativePath },
        });

        console.log(
          `Edición ${number}: Imagen asignada y renombrada a ${newFileName}`
        );
      } catch (error) {
        console.error(`Error al procesar la edición ${number}:`, error);
      }
    } else {
      console.warn(
        `Advertencia: No se encontró una imagen para la edición ${number}`
      );
    }
  }

  console.log("\x1b[36m");
  console.log(`
        ███████╗███████╗███████╗
        ██╔════╝╚════██║██╔════╝
        █████╗░░░░███╔═╝█████╗░░
        ██╔══╝░░██╔══╝░░██╔══╝░░
        ███████╗███████╗███████╗
        ╚══════╝╚══════╝╚══════╝   
                         
                   
      Imágenes procesadas exitosamente!
      `);
  console.log("\x1b[0m");

  await prisma.$disconnect();
}

processImages().catch((e) => {
  console.error("Error general en el script:", e);
  process.exit(1);
});
