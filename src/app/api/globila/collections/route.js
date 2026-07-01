import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// Expediciones de GLOBila (listas de lectura curadas del suscriptor).
// GET → lista las expediciones del usuario con conteo y portadas de preview.
// POST → crea una expedición a partir de { name, articleIds }.

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const collections = await prisma.globilaCollection.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { addedAt: "asc" },
          select: { article: { select: { id: true, beitragsId: true } } },
        },
      },
    });

    // Imágenes de preview: una sola query para todas las portadas
    const previewIds = [];
    for (const c of collections) {
      for (const it of c.items) {
        if (it.article.beitragsId) previewIds.push(it.article.beitragsId);
        previewIds.push(it.article.id);
      }
    }
    const imgByContent = new Map();
    if (previewIds.length) {
      const images = await prisma.image.findMany({
        where: { contentType: "ARTICLE", contentId: { in: previewIds } },
        select: { contentId: true, url: true },
      });
      for (const img of images) {
        if (!imgByContent.has(img.contentId)) imgByContent.set(img.contentId, img.url);
      }
    }

    const data = collections.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      count: c._count.items,
      covers: c.items
        .map(
          (it) =>
            imgByContent.get(it.article.beitragsId) ||
            imgByContent.get(it.article.id)
        )
        .filter(Boolean),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error listando expediciones GLOBila:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const rawIds = Array.isArray(body?.articleIds) ? body.articleIds : [];
    const ids = [...new Set(rawIds.map(Number).filter(Number.isFinite))];

    if (!ids.length) {
      return NextResponse.json(
        { error: "La expedición no tiene artículos" },
        { status: 400 }
      );
    }

    // Filtrar a artículos que existan de verdad (evita errores de FK)
    const existing = await prisma.article.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const validIds = existing.map((a) => a.id);
    if (!validIds.length) {
      return NextResponse.json(
        { error: "Ningún artículo válido" },
        { status: 400 }
      );
    }

    const name =
      (typeof body?.name === "string" ? body.name : "").trim().slice(0, 120) ||
      `GLOBila ${new Date().toLocaleDateString("de-DE")}`;

    const collection = await prisma.globilaCollection.create({
      data: {
        userId: session.user.id,
        name,
        items: { create: validIds.map((articleId) => ({ articleId })) },
      },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(
      {
        id: collection.id,
        name: collection.name,
        createdAt: collection.createdAt,
        count: collection._count.items,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creando expedición GLOBila:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
