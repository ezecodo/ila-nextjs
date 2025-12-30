// app/api/admin/network/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todas las organizaciones
export async function GET() {
  try {
    const partners = await prisma.networkPartner.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error("Error fetching network partners:", error);
    return NextResponse.json(
      { error: "Error al obtener las organizaciones" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva organización
export async function POST(request) {
  try {
    const body = await request.json();

    const partner = await prisma.networkPartner.create({
      data: {
        name: body.name,
        nameEs: body.nameEs || null,
        description: body.description || null,
        descriptionEs: body.descriptionEs || null,
        url: body.url,
        logoUrl: body.logoUrl || null,
        logoWidth: body.logoWidth || null,
        logoHeight: body.logoHeight || null,
        order: body.order || 0,
        active: body.active !== undefined ? body.active : true,
      },
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error creating network partner:", error);
    return NextResponse.json(
      { error: "Error al crear la organización" },
      { status: 500 }
    );
  }
}
