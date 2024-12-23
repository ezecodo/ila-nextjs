import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

async function processCSV() {
  const authors = [];
  console.log("Leyendo archivo CSV...");

  fs.createReadStream("./autores.csv") // Asegúrate de que el archivo esté en la misma carpeta
    .pipe(csv())
    .on("data", (row) => {
      // Mapeamos los campos del CSV
      const drupalID = parseInt(row["Beitrags-ID"]);
      const name = row["Name"];
      const bio = row["TextKorper"] || null;
      const personCategoryName = row["Personenkategorie"] || null; // Categoría
      const topics = row["Themenschwerpunkte"]
        ? row["Themenschwerpunkte"].split(",").map((topic) => topic.trim())
        : []; // Procesamos los temas
      const regions = row["Länder & Regionen"]
        ? row["Länder & Regionen"].split(",").map((region) => region.trim())
        : []; // Procesamos las regiones

      authors.push({
        drupalID,
        name,
        bio,
        personCategoryName,
        topics,
        regions,
      });
    })
    .on("end", async () => {
      console.log("Archivo CSV leído correctamente. Procesando datos...");

      for (const author of authors.slice(0, 4)) {
        try {
          // Buscar o crear la categoría de la persona
          let personCategory = null;
          if (author.personCategoryName) {
            personCategory = await prisma.personCategory.findUnique({
              where: { name: author.personCategoryName },
            });

            if (!personCategory) {
              personCategory = await prisma.personCategory.create({
                data: { name: author.personCategoryName },
              });
            }
          }

          // Crear el autor
          const newAuthor = await prisma.author.create({
            data: {
              name: author.name,
              bio: author.bio,
              drupalID: author.drupalID,
              personCategoryId: personCategory ? personCategory.id : null,
            },
          });

          console.log(`Autor creado: ${newAuthor.name}`);

          // Procesar temas
          for (const topicName of author.topics) {
            let topic = await prisma.topic.findUnique({
              where: { name: topicName },
            });

            if (!topic) {
              topic = await prisma.topic.create({
                data: { name: topicName },
              });
            }

            // Relacionar autor y tema
            await prisma.author.update({
              where: { id: newAuthor.id },
              data: {
                topics: {
                  connect: { id: topic.id },
                },
              },
            });

            console.log(
              `Tema relacionado: ${topic.name} para autor ${newAuthor.name}`
            );
          }

          // Procesar regiones
          for (const regionName of author.regions) {
            let region = await prisma.region.findUnique({
              where: { name: regionName },
            });

            if (!region) {
              region = await prisma.region.create({
                data: { name: regionName },
              });
            }

            // Relacionar autor y región
            await prisma.author.update({
              where: { id: newAuthor.id },
              data: {
                regions: {
                  connect: { id: region.id },
                },
              },
            });

            console.log(
              `Región relacionada: ${region.name} para autor ${newAuthor.name}`
            );
          }
        } catch (error) {
          console.error("Error al procesar el autor:", author.name, error);
        }
      }

      console.log("Proceso de importación completado.");
      await prisma.$disconnect();
    });
}

processCSV().catch((e) => {
  console.error("Error general en el script:", e);
  process.exit(1);
});
