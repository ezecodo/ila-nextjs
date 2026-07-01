import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// Detalle / renombrado / borrado de una expedición GLOBila.
// Siempre se verifica que la expedición pertenezca al usuario de la sesión.

async function getOwned(id, userId) {
  const collection = await prisma.globilaCollection.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true, createdAt: true },
  });
  if (!collection || collection.userId !== userId) return null;
  return collection;
}

export async function GET(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = (await context?.params) || {};
    const owned = await getOwned(id, session.user.id);
    if (!owned) {
      return NextResponse.json(
        { error: "Expedición no encontrada" },
        { status: 404 }
      );
    }

    const items = await prisma.globilaCollectionItem.findMany({
      where: { collectionId: id },
      orderBy: { addedAt: "asc" },
      include: {
        article: {
          include: {
            regions: true,
            topics: true,
            authors: { select: { id: true, name: true } },
            categories: true,
            beitragstyp: { select: { id: true, name: true, nameES: true } },
            edition: { select: { id: true, title: true, number: true } },
          },
        },
      },
    });

    const articles = items.map((it) => it.article);

    // Adjuntar la primera imagen de cada artículo en una sola query
    const contentIds = [];
    for (const a of articles) {
      if (a.beitragsId) contentIds.push(a.beitragsId);
      contentIds.push(a.id);
    }
    const imgByContent = new Map();
    if (contentIds.length) {
      const images = await prisma.image.findMany({
        where: { contentType: "ARTICLE", contentId: { in: contentIds } },
        select: { contentId: true, url: true, width: true, height: true },
      });
      for (const img of images) {
        if (!imgByContent.has(img.contentId)) imgByContent.set(img.contentId, img);
      }
    }

    const articlesWithImages = articles.map((a) => {
      const img = imgByContent.get(a.beitragsId) || imgByContent.get(a.id);
      const images = img ? [img] : [];
      return { ...a, images, hasImage: images.length > 0 };
    });

    return NextResponse.json({
      id: owned.id,
      name: owned.name,
      createdAt: owned.createdAt,
      articles: articlesWithImages,
    });
  } catch (error) {
    console.error("❌ Error obteniendo expedición GLOBila:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = (await context?.params) || {};
    const owned = await getOwned(id, session.user.id);
    if (!owned) {
      return NextResponse.json(
        { error: "Expedición no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const name = (typeof body?.name === "string" ? body.name : "")
      .trim()
      .slice(0, 120);
    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const updated = await prisma.globilaCollection.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error renombrando expedición GLOBila:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = (await context?.params) || {};
    const owned = await getOwned(id, session.user.id);
    if (!owned) {
      return NextResponse.json(
        { error: "Expedición no encontrada" },
        { status: 404 }
      );
    }

    await prisma.globilaCollection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error borrando expedición GLOBila:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
