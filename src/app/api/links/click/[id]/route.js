import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request, context) {
  try {
    const params = await context?.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.link.update({
      where: { id },
      data: {
        clicks: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registrando clic:", error);
    return NextResponse.json(
      { error: "Error al registrar clic" },
      { status: 500 }
    );
  }
}
