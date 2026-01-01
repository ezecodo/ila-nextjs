// app/api/banners/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener banners activos (con filtro por posición)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position");
    const now = new Date();

    const where = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (position) {
      where.position = position;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Error al obtener los banners" },
      { status: 500 }
    );
  }
}

// POST - Crear banner
export async function POST(request) {
  try {
    const body = await request.json();

    const banner = await prisma.banner.create({
      data: {
        title: body.title,
        titleEs: body.titleEs || null,
        subtitle: body.subtitle,
        subtitleEs: body.subtitleEs || null,
        description: body.description,
        descriptionEs: body.descriptionEs || null,
        buttonText: body.buttonText,
        buttonTextEs: body.buttonTextEs || null,
        buttonUrl: body.buttonUrl,
        imageUrl: body.imageUrl || null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive !== undefined ? body.isActive : true,
        position: body.position || "top",
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Error al crear el banner" },
      { status: 500 }
    );
  }
}
