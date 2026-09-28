import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { uploadFile } from "@/lib/localUpload";

// POST — agrega UNA imagen principal (contentType "ARTICLE") a un artículo,
// sin tocar nada más. Lo usa "Artikel ohne Bild": el PUT de /api/articles/[id]
// es el guardado completo del editor clásico y, mandándole solo una imagen,
// podría pisar otros campos o borrar imágenes vía keepImages.
// FormData: file (obligatorio), title, alt, displayMode.
export async function POST(req, context) {
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

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, beitragsId: true, edition: { select: { number: true } } },
    });
    if (!article) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !file.name) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }

    const editionNumber = article.edition?.number;
    const subfolder = editionNumber
      ? `images/editions/${editionNumber}/articulos`
      : "images/online";
    const { url } = await uploadFile(file, subfolder, `article_${article.id}`);

    const image = await prisma.image.create({
      data: {
        contentType: "ARTICLE",
        contentId: article.beitragsId || article.id,
        url,
        title: formData.get("title") || null,
        alt: formData.get("alt") || null,
        displayMode: formData.get("displayMode") || null,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error("❌ Error agregando imagen al artículo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
