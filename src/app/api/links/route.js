import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const now = new Date();

    // Si all=true, devolver todos (para dashboard)
    // Si no, solo los activos y dentro del rango de fechas (para página pública)
    const links = await prisma.link.findMany({
      where: all
        ? {}
        : {
            isActive: true,
            OR: [
              { startDate: null, endDate: null },
              { startDate: { lte: now }, endDate: null },
              { startDate: null, endDate: { gte: now } },
              { startDate: { lte: now }, endDate: { gte: now } },
            ],
          },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }],
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Error obteniendo links:", error);
    return NextResponse.json(
      { error: "Error al obtener links" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      titleES,
      url,
      icon,
      category,
      isFeatured,
      startDate,
      endDate,
      authorName,
      imageUrl,
      linkType,
      editionNumber,
      editionCoverImage,
    } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "Título y URL son obligatorios" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.link.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newLink = await prisma.link.create({
      data: {
        title,
        titleES: titleES || null,
        url,
        icon: icon || null,
        category: category || null,
        isFeatured: isFeatured || false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        order: (maxOrder?.order || 0) + 1,
        authorName: authorName || null,
        imageUrl: imageUrl || null,
        linkType: linkType || "general",
        editionNumber: editionNumber ?? null,
        editionCoverImage: editionCoverImage || null,
      },
    });

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error("Error creando link:", error);
    return NextResponse.json({ error: "Error al crear link" }, { status: 500 });
  }
}
