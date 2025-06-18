import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, type Region } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const beitragstypId = url.searchParams.get("beitragstypId");
    const regionId = url.searchParams.get("regionId");
    const locale = url.searchParams.get("locale");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const baseWhere: Prisma.ArticleWhereInput[] = [{ isPublished: true }];

    if (locale === "es") {
      baseWhere.push({ isTranslatedES: true });
      baseWhere.push({ needsReviewES: false });
    }

    if (beitragstypId) {
      baseWhere.push({ beitragstypId: parseInt(beitragstypId, 10) });
    }

    let regionFilteredBeitragsIds: number[] | null = null;

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

      const regionIdsToMatch = [
        targetId,
        ...collectDescendantIds(targetId, allRegions),
      ];

      const articlesInRegions = await prisma.article.findMany({
        where: {
          regions: {
            some: {
              id: { in: regionIdsToMatch },
            },
          },
        },
        select: {
          beitragsId: true,
        },
      });

      regionFilteredBeitragsIds = Array.from(
        new Set(
          articlesInRegions
            .map((a: { beitragsId: number | null }) => a.beitragsId)
            .filter((id: number | null): id is number => typeof id === "number")
        )
      );

      if (regionFilteredBeitragsIds.length === 0) {
        return NextResponse.json({ articles: [] });
      }

      baseWhere.push({
        beitragsId: { in: regionFilteredBeitragsIds },
      });
    }

    interface ArticleWithExtras {
      id: number;
      beitragsId: number | null;
      title?: string;
      publicationDate?: Date;
      // agrega otros campos relevantes que uses en el renderizado
    }

    const articles: ArticleWithExtras[] = await prisma.article.findMany({
      where: { AND: baseWhere },
      orderBy: { publicationDate: "desc" },
      take: limit,
      include: {
        regions: true,
        topics: true,
        authors: { select: { id: true, name: true } },
        categories: true,
        beitragstyp: {
          select: { id: true, name: true, nameES: true },
        },
        edition: {
          select: { id: true, title: true, number: true },
        },
      },
    });

    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const contentId = article.beitragsId || article.id;
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId,
          },
        });

        return { ...article, images };
      })
    );

    return NextResponse.json({ articles: articlesWithImages });
  } catch (error) {
    console.error("❌ Error final:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
