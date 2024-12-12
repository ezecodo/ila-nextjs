import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises"; // Usar `fs/promises` para manejar Promesas

const prisma = new PrismaClient();

async function insertTopics(topics, parentId = null) {
  for (const topic of topics) {
    const createdTopic = await prisma.topic.create({
      data: {
        name: topic.name,
        parentId: parentId,
      },
    });

    if (topic.children && topic.children.length > 0) {
      await insertTopics(topic.children, createdTopic.id);
    }
  }
}

async function main() {
  try {
    // Leer el archivo JSON de manera asíncrona
    const topicsData = JSON.parse(await readFile("./topics.json", "utf-8"));

    // Insertar regiones en la base de datos
    await insertTopics(topicsData);
    console.log("Topicos insertadas correctamente.");
  } catch (error) {
    console.error("Error al insertar Topicos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
