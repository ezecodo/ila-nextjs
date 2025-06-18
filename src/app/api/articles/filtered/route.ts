import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Region } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const beitragstypId = url.searchParams.get("beitragstypId");
    const regionId = url.searchParams.get("regionId");
    const locale = url.searchParams.get("locale");

    const filters: Record<string, any>[] = [{ isPublished: true }];

    // 🔥 Español: solo artículos traducidos y revisados
    if (locale === "es") {
      filters.push({ isTranslatedES: true });
      filters.push({ needsReviewES: false });
    }

    // 🔥 Tipo de contenido
    if (beitragstypId) {
      filters.push({ beitragstypId: parseInt(beitragstypId, 10) });
    }

    // 🔥 Región + descendientes
    if (regionId) {
      const allRegions: Region[] = await prisma.region.findMany();
      const targetId = Number(regionId);

      const collectDescendantIds = (
        id: number,
        regions: Region[]
      ): number[] => {
        const children = regions.filter((r) => r.parentId === id);
        return children.reduce<number[]>(
          (acc, child) => [
            ...acc,
            child.id,
            ...collectDescendantIds(child.id, regions),
          ],
          []
        );
      };

      const regionIds = [
        targetId,
        ...collectDescendantIds(targetId, allRegions),
      ];

      filters.push({
        regions: {
          some: {
            id: { in: regionIds },
          },
        },
      });
    }

    console.log("➡️ Filters aplicados:", JSON.stringify(filters, null, 2));

    // 🔥 Query principal
    const articles = await prisma.article.findMany({
      where: {
        AND: filters,
      },
      orderBy: { publicationDate: "desc" },
      take: limit,
      include: {
        regions: true,
        topics: true,
        categories: true,
        authors: {
          select: { id: true, name: true },
        },
        beitragstyp: {
          select: {
            id: true,
            name: true,
            nameES: true,
          },
        },
        edition: {
          select: { id: true, title: true, number: true },
        },
      },
    });

    // 🔥 Cargar imágenes
    const articlesWithImages = await Promise.all(
      articles.map(
        async (
          article: Awaited<ReturnType<typeof prisma.article.findMany>>[number]
        ) => {
          const contentIdToUse = article.beitragsId || article.id;
          const images = await prisma.image.findMany({
            where: {
              contentType: "ARTICLE",
              contentId: contentIdToUse,
            },
          });

          return { ...article, images };
        }
      )
    );

    return NextResponse.json({ articles: articlesWithImages }, { status: 200 });
  } catch (error) {
    console.error("❌ Error en /api/articles/filtered:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
