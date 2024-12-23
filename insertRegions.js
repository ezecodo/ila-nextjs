import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises"; // Usar `fs/promises` para manejar Promesas

const prisma = new PrismaClient();

async function insertRegions(regions, parentId = null) {
  for (const region of regions) {
    const createdRegion = await prisma.region.create({
      data: {
        name: region.name,
        parentId: parentId,
      },
    });

    if (region.children && region.children.length > 0) {
      await insertRegions(region.children, createdRegion.id);
    }
  }
}

async function main() {
  try {
    // Leer el archivo JSON de manera asíncrona
    const regionsData = JSON.parse(
      await readFile("./ALI_categories.json", "utf-8")
    );

    // Insertar regiones en la base de datos
    await insertRegions(regionsData);
    console.log("Regiones insertadas correctamente.");
  } catch (error) {
    console.error("Error al insertar regiones:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
