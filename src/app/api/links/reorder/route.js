import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req) {
  try {
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds debe ser un array" },
        { status: 400 }
      );
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.link.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordenando links:", error);
    return NextResponse.json(
      { error: "Error al reordenar links" },
      { status: 500 }
    );
  }
}
