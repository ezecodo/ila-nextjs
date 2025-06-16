import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const beitragstypId = url.searchParams.get("beitragstypId");
    const regionId = url.searchParams.get("regionId");

    const filters: any = {};

    // Si hay regionId, buscar artículos que tengan esa región o sus hijos
    if (regionId) {
      const allRegions = await prisma.region.findMany();
      const targetId = Number(regionId);

      // Recursivamente encuentra todos los IDs hijos
      const collectDescendantIds = (id: number, regions: any[]): number[] => {
        const children = regions.filter((r) => r.parentId === id);
        return children.reduce(
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

      filters.regions = {
        some: {
          id: {
            in: regionIdsToMatch,
          },
        },
      };
    }

    // Si hay beitragstypId
    if (beitragstypId) {
      filters.beitragstypId = Number(beitragstypId);
    }

    const articles = await prisma.article.findMany({
      where: filters,
      include: {
        regions: true,
        beitragstyp: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error en el filtrado:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
