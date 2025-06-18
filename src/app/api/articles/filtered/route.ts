import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Region } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const beitragstypId = url.searchParams.get("beitragstypId");
    const regionId = url.searchParams.get("regionId");

    const filters: Record<string, unknown>[] = [];

    if (beitragstypId) {
      filters.push({ beitragstypId: Number(beitragstypId) });
    }

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

      const descendantIds = collectDescendantIds(targetId, allRegions);
      const regionIdsToMatch = [targetId, ...descendantIds];

      filters.push({
        regions: {
          some: {
            id: { in: regionIdsToMatch },
          },
        },
      });
    }

    const articles = await prisma.article.findMany({
      where: {
        AND: filters,
      },
      include: {
        regions: true,
        beitragstyp: true,
      },
      orderBy: {
        publicationDate: "desc",
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error filtrando artículos:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
