import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔹 Crear un carrusel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titleES,
      titleDE,
      beitragstypId,
      limit,
      orderBy,
      regionId,
      categoryIds,
      isManual,
      articleIds,
      placement,
    } = body;

    // 🆕 Crear carrusel manual
    if (isManual && articleIds && Array.isArray(articleIds)) {
      const carousel = await prisma.carousel.create({
        data: {
          titleES: titleES || null,
          titleDE: titleDE || null,
          limit: limit || 10,
          orderBy: orderBy || "date_desc",
          isManual: true,
          placement: placement || "after",
          articles: {
            create: articleIds.map((articleId: number, index: number) => ({
              articleId: Number(articleId),
              position: index,
            })),
          },
        },
        include: {
          articles: {
            include: {
              article: {
                select: { id: true, title: true },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });

      return NextResponse.json(carousel, { status: 201 });
    }

    // ✅ Crear carrusel automático (lógica original)
    const carousel = await prisma.carousel.create({
      data: {
        titleES: titleES || null,
        titleDE: titleDE || null,
        beitragstypId: beitragstypId ? Number(beitragstypId) : null,
        limit: limit || 10,
        orderBy: orderBy || "date_desc",
        regionId: regionId ? Number(regionId) : null,
        isManual: false,
        placement: placement || "after",
        categories: categoryIds
          ? {
              connect: categoryIds.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: { select: { id: true, name: true, nameES: true } },
        beitragstyp: { select: { id: true, name: true, nameES: true } },
        region: { select: { id: true, name: true, nameES: true } },
      },
    });

    return NextResponse.json(carousel, { status: 201 });
  } catch (error) {
    console.error("❌ Error creando carrusel:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// 🔹 Listar todos los carruseles
export async function GET() {
  try {
    const carousels = await prisma.carousel.findMany({
      orderBy: { position: "asc" },
      select: {
        id: true,
        titleES: true,
        titleDE: true,
        limit: true,
        position: true,
        placement: true,
        beitragstypId: true,
        regionId: true,
        isManual: true,
        region: { select: { id: true, name: true, nameES: true } },
        beitragstyp: { select: { id: true, name: true, nameES: true } },
        categories: { select: { id: true, name: true, nameES: true } },
        articles: {
          include: {
            article: {
              select: { id: true, title: true, titleES: true },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(carousels, { status: 200 });
  } catch (error) {
    console.error("❌ Error obteniendo carruseles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
