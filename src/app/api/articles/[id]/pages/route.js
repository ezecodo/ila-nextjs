import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// PATCH — actualiza solo startPage/endPage de un artículo (referencia de la
// página en el Dossier impreso). Lo usa "Artikel ohne Bild" para completar la
// página de artículos cargados sin ella, sin pasar por el editor completo.
// Body JSON: { startPage, endPage } — número o null/"" para vaciar.
export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const toPage = (v) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const startPage = toPage(body.startPage);
    const endPage = toPage(body.endPage);
    if (startPage && endPage && endPage < startPage) {
      return NextResponse.json(
        { error: "La página final es anterior a la inicial" },
        { status: 400 },
      );
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: { startPage, endPage },
      select: { id: true, startPage: true, endPage: true },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("❌ Error actualizando páginas del artículo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
