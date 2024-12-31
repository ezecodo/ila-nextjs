import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

// Función para convertir meses en alemán al formato numérico
function parseMonth(month) {
  const months = {
    Januar: "01",
    Februar: "02",
    März: "03",
    April: "04",
    Mai: "05",
    Juni: "06",
    Juli: "07",
    August: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Dezember: "12",
  };
  return months[month] || null;
}

// Función para procesar fechas en formato alemán completo
function parseDate(germanDate) {
  try {
    const dateParts = germanDate.split(" ");
    const month = dateParts[2]; // Extraer el mes
    const year = dateParts[3]; // Extraer el año
    const numericMonth = parseMonth(month);
    if (!numericMonth || !year) throw new Error("Fecha inválida");
    return new Date(`${year}-${numericMonth}-01`);
  } catch (e) {
    console.error(`Error al procesar la fecha: ${germanDate}`, e.message);
    return null;
  }
}

async function processCSV() {
  const editions = [];

  console.log("Leyendo archivo CSV...");
  fs.createReadStream("./editions.csv")
    .pipe(csv())
    .on("data", (row) => {
      try {
        // Extraer y mapear columnas del CSV a los campos de Prisma
        const number = parseInt(row["_0"], 10); // `number` corresponde a la columna `_0`
        const title = row["_4"]?.trim() || "Sin Título"; // `title` corresponde a la columna `_4`
        const subtitle = row["_5"]?.trim() || null; // `subtitle` corresponde a la columna `_5`
        const summary = row["_2"]?.trim() || null; // `summary` corresponde a la columna `_2`
        const isCurrent = row["_10"]?.trim() === "Ja"; // `isCurrent` corresponde a la columna `_10`
        const isAvailableToOrder = row["_6"]?.trim() === "Ja"; // `isAvailableToOrder` corresponde a la columna `_6`
        const tableOfContents = row["_7"]?.trim() || null; // `tableOfContents` corresponde a la columna `_7`
        const drupalId = parseInt(row["_1"], 10) || null; // `drupalId` corresponde a la columna `_1`
        const datePublished = parseDate(row["_3"]); // Fecha en columna `_3`

        // Procesar regiones y temas
        const regions = row["_8"]
          ? row["_8"]
              .split(",")
              .map((region) => region.trim())
              .filter(Boolean)
          : [];
        const topics = row["_9"]
          ? row["_9"]
              .split(",")
              .map((topic) => topic.trim())
              .filter(Boolean)
          : [];

        // Validar datos esenciales
        if (number && title) {
          editions.push({
            number,
            title,
            subtitle,
            summary,
            isCurrent,
            isAvailableToOrder,
            tableOfContents,
            drupalId,
            datePublished,
            regions,
            topics,
          });
        } else {
          console.warn(`Datos inválidos en la fila: ${JSON.stringify(row)}`);
        }
      } catch (error) {
        console.error(
          `Error procesando la fila: ${JSON.stringify(row)}`,
          error
        );
      }
    })
    .on("end", async () => {
      console.log("Archivo CSV leído correctamente. Procesando datos...");
      for (const edition of editions) {
        try {
          // Conectar regiones
          const connectedRegions = [];
          for (const regionName of edition.regions) {
            let region = await prisma.region.findUnique({
              where: { name: regionName },
            });
            if (!region) {
              region = await prisma.region.create({
                data: { name: regionName },
              });
            }
            connectedRegions.push({ id: region.id });
          }

          // Conectar temas
          const connectedTopics = [];
          for (const topicName of edition.topics) {
            let topic = await prisma.topic.findUnique({
              where: { name: topicName },
            });
            if (!topic) {
              topic = await prisma.topic.create({
                data: { name: topicName },
              });
            }
            connectedTopics.push({ id: topic.id });
          }

          // Crear la edición en la base de datos
          const newEdition = await prisma.edition.create({
            data: {
              number: edition.number,
              title: edition.title,
              subtitle: edition.subtitle,
              summary: edition.summary,
              isCurrent: edition.isCurrent,
              isAvailableToOrder: edition.isAvailableToOrder,
              tableOfContents: edition.tableOfContents,
              drupalId: edition.drupalId,
              datePublished: edition.datePublished,
              regions: { connect: connectedRegions },
              topics: { connect: connectedTopics },
            },
          });

          console.log(`Edición creada: ${newEdition.title}`);
        } catch (error) {
          console.error(
            `Error al procesar la edición: ${edition.title}`,
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
