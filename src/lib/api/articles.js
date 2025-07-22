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
    console.error("Error en getArticleByLegacyPath:", error);
    return null;
  }
}
