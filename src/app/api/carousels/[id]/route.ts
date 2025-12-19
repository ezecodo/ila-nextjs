import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔹 GET: obtener un carrusel por ID
export async function GET(nextRequest: NextRequest) {
  const url = new URL(nextRequest.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const carousel = await prisma.carousel.findUnique({
      where: { id },
      select: {
        id: true,
        titleES: true,
        titleDE: true,
        beitragstypId: true,
        regionId: true,
        limit: true,
        orderBy: true,
        position: true,
        isManual: true,
        createdAt: true,
        updatedAt: true,
        beitragstyp: {
          select: { id: true, name: true, nameES: true },
        },
        region: {
          select: { id: true, name: true, nameES: true },
        },
        categories: {
          select: { id: true, name: true, nameES: true },
        },
        articles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                titleES: true,
                edition: {
                  select: {
                    id: true,
                    number: true,
                    title: true,
                    titleES: true,
                    datePublished: true,
                  },
                },
                authors: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!carousel) {
      return NextResponse.json(
        { error: "Carrusel no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(carousel, { status: 200 });
  } catch (error) {
    console.error("❌ Error obteniendo carrusel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// 🔹 PUT: actualizar un carrusel
export async function PUT(nextRequest: NextRequest) {
  const url = new URL(nextRequest.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const body = await nextRequest.json();
    const {
      titleES,
      titleDE,
      beitragstypId,
      limit,
      orderBy,
      regionId,
      position,
      categoryIds,
      isManual,
      articleIds,
    } = body;

    // 🆕 Si cambia a manual o actualiza artículos manuales
    if (isManual !== undefined && isManual && articleIds) {
      // Eliminar artículos antiguos y crear nuevos
      await prisma.carouselArticle.deleteMany({
        where: { carouselId: id },
      });

      const updated = await prisma.carousel.update({
        where: { id },
        data: {
          titleES,
          titleDE,
          limit,
          orderBy,
          position,
          isManual: true,
          beitragstypId: null,
          regionId: null,
          categories: { set: [] },
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
                select: {
                  id: true,
                  title: true,
                  titleES: true,
                  edition: {
                    select: {
                      id: true,
                      number: true,
                      title: true,
                      titleES: true,
                      datePublished: true,
                    },
                  },
                  authors: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    // ✅ Si cambia a automático o actualiza carrusel automático
    if (isManual !== undefined && !isManual) {
      // Eliminar artículos manuales si los hay
      await prisma.carouselArticle.deleteMany({
        where: { carouselId: id },
      });
    }

    const updated = await prisma.carousel.update({
      where: { id },
      data: {
        titleES,
        titleDE,
        beitragstypId: beitragstypId || null,
        limit,
        orderBy,
        regionId: regionId || null,
        position,
        isManual: isManual ?? false,
        categories: categoryIds
          ? {
              set: categoryIds.map((cid: string) => ({ id: cid })),
            }
          : undefined,
      },
      include: {
        categories: { select: { id: true, name: true, nameES: true } },
        beitragstyp: { select: { id: true, name: true, nameES: true } },
        region: { select: { id: true, name: true, nameES: true } },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Error actualizando carrusel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// 🔹 DELETE: eliminar un carrusel
export async function DELETE(nextRequest: NextRequest) {
  const url = new URL(nextRequest.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    await prisma.carousel.delete({ where: { id } });

    return NextResponse.json(
      { message: "Carrusel eliminado" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error eliminando carrusel:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
