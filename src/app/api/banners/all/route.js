// app/api/banners/all/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener TODOS los banners (para dashboard)
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching all banners:", error);
    return NextResponse.json(
      { error: "Error al obtener los banners" },
      { status: 500 }
    );
  }
}
