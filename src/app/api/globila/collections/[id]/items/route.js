import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// Quitar un artículo de una expedición GLOBila. Body: { articleId }.
export async function DELETE(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = (await context?.params) || {};

    const collection = await prisma.globilaCollection.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Expedición no encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const articleId = Number(body?.articleId);
    if (!Number.isFinite(articleId)) {
      return NextResponse.json({ error: "articleId requerido" }, { status: 400 });
    }

    await prisma.globilaCollectionItem.deleteMany({
      where: { collectionId: id, articleId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error quitando artículo de expedición:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
