import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ error: "IDs requeridos" }, { status: 400 });
    }

    const ids = idsParam.split(",").map((id) => parseInt(id, 10));

    const articles = await prisma.article.findMany({
      where: {
        id: { in: ids },
        isPublished: true,
      },
      select: {
        id: true,
        beitragsId: true,
        legacyPath: true,
        title: true,
        titleES: true,
        subtitle: true,
        subtitleES: true,
        content: true,
        contentES: true,
        previewText: true,
        previewTextES: true,
        publicationDate: true,
        isTranslatedES: true,
        articleImage: true,
        authors: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            nameES: true,
          },
        },
        regions: {
          select: {
            id: true,
            name: true,
            nameES: true,
          },
        },
        topics: {
          select: {
            id: true,
            name: true,
            nameES: true,
          },
        },
        edition: {
          select: {
            id: true,
            number: true,
            datePublished: true,
          },
        },
        beitragstyp: {
          select: {
            id: true,
            name: true,
            nameES: true,
          },
        },
      },
    });
    // Cargar imágenes para cada artículo (igual que filtered)
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const contentId = article.beitragsId || article.id;
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId,
          },
          orderBy: {
            id: "asc",
          },
        });

        return {
          ...article,
          images,
        };
      })
    );

    return NextResponse.json(articlesWithImages);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
