import { NextResponse } from "next/server";
import { auth } from "../../auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener matches de una edición
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const editionId = searchParams.get("editionId");

  if (!editionId) {
    return NextResponse.json({ error: "editionId requerido" }, { status: 400 });
  }

  try {
    const now = new Date();

    const matches = await prisma.tocManualMatch.findMany({
      where: {
        editionId: parseInt(editionId),
        article: {
          isPublished: true,
          OR: [{ publicationDate: null }, { publicationDate: { lte: now } }],
        },
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            titleES: true,
            subtitle: true,
            subtitleES: true,
            isTranslatedES: true,
            legacyPath: true,
            isPublished: true,
            publicationDate: true,
          },
        },
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error obteniendo matches:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Crear un match manual
export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { editionId, tocTitle, articleId } = await request.json();

    if (!editionId || !tocTitle || !articleId) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const match = await prisma.tocManualMatch.upsert({
      where: {
        editionId_tocTitle: {
          editionId: parseInt(editionId),
          tocTitle: tocTitle,
        },
      },
      update: {
        articleId: parseInt(articleId),
        createdBy: session.user.id,
      },
      create: {
        editionId: parseInt(editionId),
        tocTitle: tocTitle,
        articleId: parseInt(articleId),
        createdBy: session.user.id,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            titleES: true,
            subtitle: true,
            subtitleES: true,
            isTranslatedES: true,
            legacyPath: true,
          },
        },
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error creando match:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar un match manual
export async function DELETE(request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { editionId, tocTitle } = await request.json();

    if (!editionId || !tocTitle) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    await prisma.tocManualMatch.delete({
      where: {
        editionId_tocTitle: {
          editionId: parseInt(editionId),
          tocTitle: tocTitle,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando match:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
