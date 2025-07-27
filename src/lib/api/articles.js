import { prisma } from "@/lib/prisma";
// ⚠️ Forzamos que Prisma nunca sea eliminado en producción
if (!prisma)
  throw new Error(
    "❌ Prisma no está definido — revisa tu import de lib/prisma.js"
  );
export async function getArticleById(id) {
  try {
    const article = await prisma.article.findUnique({
      where: {
        id: parseInt(id, 10),
      },
      select: {
        id: true,
        title: true,
        titleES: true,
        subtitle: true,
        subtitleES: true,
        previewText: true,
        previewTextES: true,
        beitragsId: true,
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            id: true,
            number: true,
            title: true,
            coverImage: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            _count: { select: { articles: true } },
          },
        },
        categories: true,
        regions: true,
        topics: true,
      },
    });

    if (!article) return null;

    const contentIdToUse = article.beitragsId || article.id;

    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: contentIdToUse,
      },
    });

    return { ...article, images };
  } catch (error) {
    console.error("Error en getArticleById:", error);
    return null;
  }
}

export async function getArticleByLegacyPath(path) {
  try {
    console.log("\n\n🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥");
    console.log("📌 BUSCANDO ARTICLE CON PATH:", path);
    console.log("🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥\n\n");

    const article = await prisma.article.findFirst({
      where: {
        legacyPath: path,
      },
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            id: true,
            number: true,
            title: true,
            coverImage: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            _count: { select: { articles: true } },
          },
        },
        categories: true,
        regions: true,
        topics: true,
      },
    });

    if (!article) {
      console.warn("\n\n🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨");
      console.warn("⚠️ ARTÍCULO NO ENCONTRADO PARA:", path);
      console.warn("🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨\n\n");
      return null;
    }

    const contentIdToUse = article.beitragsId || article.id;

    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: contentIdToUse,
      },
    });

    return { ...article, images };
  } catch (error) {
    console.error("❌ Error en getArticleByLegacyPath:", error);
    return null;
  }
}
