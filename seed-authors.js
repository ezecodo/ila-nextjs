import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

async function processCSV() {
  const authors = [];
  console.log("Leyendo archivo CSV...");

  fs.createReadStream("./autores.csv")
    .pipe(csv())
    .on("data", (row) => {
      // Mapear las columnas del CSV a variables
      const name = row["_0"]?.trim(); // Nombre del autor
      const drupalId = parseInt(row["_1"], 10); // ID de Drupal
      const bio = row["_4"] || null; // Biografía o texto adicional
      const personCategoryName = row["_5"]?.trim() || null; // Categoría de la persona
      const topics = row["_2"]
        ? row["_2"]
            .split(",")
            .map((topic) => topic.trim())
            .filter(Boolean)
        : []; // Temas
      const regions = row["_6"]
        ? row["_6"]
            .split(",")
            .map((region) => region.trim())
            .filter(Boolean)
        : []; // Regiones

      // Validar datos esenciales
      if (name && !isNaN(drupalId)) {
        authors.push({
          drupalId,
          name,
          bio,
          personCategoryName,
          topics,
          regions,
        });
      } else {
        console.warn(`Datos inválidos: ${JSON.stringify(row)}`);
      }
    })
    .on("end", async () => {
      console.log("Archivo CSV leído correctamente. Procesando datos...");

      for (const author of authors) {
        try {
          let personCategory = null;

          // Crear o buscar la categoría de persona
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

          // Crear el autor con drupalId como campo adicional
          const newAuthor = await prisma.author.create({
            data: {
              name: author.name,
              bio: author.bio,
              drupalId: author.drupalId, // Mantener drupalId como campo adicional
              personCategoryId: personCategory ? personCategory.id : null,
            },
          });

          console.log(`\u2714 Autor creado: ${newAuthor.name}`);

          // Relacionar temas
          for (const topicName of author.topics) {
            let topic = await prisma.topic.findUnique({
              where: { name: topicName },
            });

            if (!topic) {
              topic = await prisma.topic.create({ data: { name: topicName } });
            }

            await prisma.author.update({
              where: { id: newAuthor.id },
              data: { topics: { connect: { id: topic.id } } },
            });

            console.log(
              `\u2714 Tema relacionado: ${topic.name} para autor ${newAuthor.name}`
            );
          }

          // Relacionar regiones
          for (const regionName of author.regions) {
            let region = await prisma.region.findUnique({
              where: { name: regionName },
            });

            if (!region) {
              region = await prisma.region.create({
                data: { name: regionName },
              });
            }

            await prisma.author.update({
              where: { id: newAuthor.id },
              data: { regions: { connect: { id: region.id } } },
            });

            console.log(
              `\u2714 Región relacionada: ${region.name} para autor ${newAuthor.name}`
            );
          }
        } catch (error) {
          console.error(
            "Error al procesar el autor:",
            author.name || "desconocido",
            error
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
                         
                   
      Importación completada exitosamente!
      `);
      console.log("\x1b[0m");
      await prisma.$disconnect();
    });
}

processCSV().catch((e) => {
  console.error("Error general en el script:", e);
  process.exit(1);
});
