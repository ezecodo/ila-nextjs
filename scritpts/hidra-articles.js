import fs from "fs";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function importArticles() {
  const articlesMap = new Map();

  const parser = fs
    .createReadStream("./articulacionn.csv")
    .pipe(parse({ columns: true }));

  for await (const row of parser) {
    const beitragsId = row["Beitrags-ID"]
      ? parseInt(row["Beitrags-ID"], 10)
      : null;

    if (articlesMap.has(beitragsId)) {
      const existingArticle = articlesMap.get(beitragsId);

      if (
        row["articleImage"] &&
        !existingArticle.articleImage.includes(row["articleImage"])
      ) {
        existingArticle.articleImage.push(row["articleImage"]);
      }
    } else {
      articlesMap.set(beitragsId, {
        beitragsId,
        title: row["title"],
        subtitle: row["subtitle"],
        beitragstyp: row["beitragstyp"],
        content: row["content"],
        previewText: row["previewText"],
        startPage: row["startPage"] ? parseInt(row["startPage"], 10) : null,
        endPage: row["endPage"] ? parseInt(row["endPage"], 10) : null,
        publicationDate: row["publicationDate"]
          ? new Date(row["publicationDate"])
          : null,
        authors: row["Author"] ? row["Author"].split(",") : [],
        interviewees: row["Interviewee"] ? row["Interviewee"].split(",") : [],
        edition: row["edition"],
        isInPrintEdition: row["isInPrintEdition"] === "ja",
        regions: row["regions"] ? row["regions"].split(",") : [],
        articleCategories: row["articleCategories"]
          ? row["articleCategories"].split(",")
          : [],
        topics: row["topics"] ? row["topics"].split(",") : [],
        mediaTitle: row["mediaTitle"],
        additionalInfo: row["additionalInfo"],
        articleImage: row["articleImage"] ? [row["articleImage"]] : [],
      });
    }
  }

  console.log("CSV leído con éxito. Importando...");

  for (const article of articlesMap.values()) {
    try {
      article.articleImage = article.articleImage.join(",");

      const createdArticle = await createArticleWithRelations(article);
      console.log(`Artículo con ID ${createdArticle.id} importado.`);
    } catch (error) {
      console.error(
        `Error al importar el artículo con Beitrags-ID ${article.beitragsId}:`,
        error
      );
    }
  }

  console.log("Importación completada.");
  await prisma.$disconnect();
}

async function createArticleWithRelations(article) {
  // Manejar Beitragstyp
  let beitragstypConnection = null;
  if (article.beitragstyp) {
    try {
      const beitragstypName = article.beitragstyp.trim();
      const existingBeitragstyp = await prisma.beitragstyp.upsert({
        where: { name: beitragstypName },
        update: {},
        create: { name: beitragstypName },
      });
      beitragstypConnection = { id: existingBeitragstyp.id };
    } catch (error) {
      console.error(
        `Error con Beitragstyp para el artículo ${article.title}:`,
        error
      );
    }
  }

  // Crear artículo con relaciones
  try {
    return await prisma.article.create({
      data: {
        beitragsId: article.beitragsId,
        title: article.title,
        content: article.content,
        subtitle: article.subtitle,
        previewText: article.previewText,
        startPage: article.startPage,
        endPage: article.endPage,
        publicationDate: article.publicationDate,
        isInPrintEdition: article.isInPrintEdition,
        mediaTitle: article.mediaTitle,
        additionalInfo: article.additionalInfo,
        articleImage: article.articleImage,
        beitragstyp: beitragstypConnection
          ? { connect: { id: beitragstypConnection.id } }
          : undefined,
      },
    });
  } catch (error) {
    console.error(
      `Error al crear el artículo con Beitrags-ID ${article.beitragsId}:`,
      error
    );
    throw error;
  }
}

importArticles();
