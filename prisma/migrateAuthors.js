import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csvParser from "csv-parser";

const prisma = new PrismaClient();

async function importAuthorsFromCSV() {
  const authors = [];

  // Leer el archivo CSV
  fs.createReadStream("autores.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      authors.push({
        id: parseInt(row["Beitrags-ID"], 10), // ID del autor
        name: row["Name"], // Nombre
        email: null, // Opcional: Si no hay emails en el CSV
        role: row["Personenkategorie"], // Categoría del autor
        bio: row["Textkörper"] || null, // Información adicional
        location: row["Ort"] || null, // Ubicación
        regions: row["Länder & Regionen"]
          ? row["Länder & Regionen"].split(",").map((region) => region.trim())
          : [], // Regiones separadas por comas
        topics: row["Themenschwerpunkte"]
          ? row["Themenschwerpunkte"].split(",").map((topic) => topic.trim())
          : [], // Temas separados por comas
      });
    })
    .on("end", async () => {
      console.log(`Importando ${authors.length} autores...`);

      for (const author of authors) {
        // Crear relaciones con regiones y temas
        const regionRecords = await Promise.all(
          author.regions.map(async (regionName) => {
            return prisma.region.upsert({
              where: { name: regionName },
              update: {},
              create: { name: regionName },
            });
          })
        );

        const topicRecords = await Promise.all(
          author.topics.map(async (topicName) => {
            return prisma.topic.upsert({
              where: { name: topicName },
              update: {},
              create: { name: topicName },
            });
          })
        );

        // Insertar el autor con las relaciones
        await prisma.author.upsert({
          where: { id: author.id },
          update: {},
          create: {
            id: author.id,
            name: author.name,
            email: author.email,
            role: author.role,
            bio: author.bio,
            location: author.location,
            regions: { connect: regionRecords.map((r) => ({ id: r.id })) },
            topics: { connect: topicRecords.map((t) => ({ id: t.id })) },
          },
        });
      }

      console.log("Importación completada.");
      await prisma.$disconnect();
    });
}

importAuthorsFromCSV().catch((e) => {
  console.error(e);
  process.exit(1);
});
