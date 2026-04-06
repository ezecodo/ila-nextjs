import slugify from "@/lib/slugify";
import * as Sentry from "@sentry/nextjs";
import { uploadFile } from "@/lib/localUpload";

import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb", // Ajusta el límite según lo necesario
    },
  },
};

// ✅ GET: Listar artículos (incluye nuevos filtros)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = request.headers.get("x-locale") || "de";
    const upcoming = searchParams.get("upcoming") === "true"; // 👈 nuevo parámetro

    // Base: artículos traducidos si el idioma es ES
    let where = locale === "es" ? { isTranslatedES: true } : {};

    // 👇 Si queremos ver artículos programados para el futuro
    if (upcoming) {
      where = {
        ...where,
        isPublished: false,
        publicationDate: { gt: new Date() },
      };
    }

    // 1️⃣ Consulta artículos base (sin imágenes todavía)
    const articles = await prisma.article.findMany({
      where,
      include: {
        beitragstyp: { select: { name: true, nameES: true } },
        beitragssubtyp: true,
        edition: { select: { number: true, title: true, datePublished: true } },
        authors: { select: { id: true, name: true } },
        articleCategories: {
          include: {
            category: { select: { id: true, name: true, nameES: true } },
          },
        },
        regions: true,
        topics: true,
      },
      orderBy: { publicationDate: "desc" }, // 👈 ordenamos por fecha
    });

    // 2️⃣ Resolver imágenes manualmente
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: { in: [article.beitragsId, article.id].filter(Boolean) },
          },
        });
        return { ...article, images };
      })
    );

    // 3️⃣ Transformar artículos (categorías y traducciones)
    const transformedArticles = articlesWithImages.map((article) => ({
      ...article,
      categories: article.articleCategories.map((ac) => ({
        id: ac.category.id,
        name: ac.category.name,
        nameES: ac.category.nameES,
      })),
      articleCategories: undefined,
      titleES: article.titleES,
      subtitleES: article.subtitleES,
      previewTextES: article.previewTextES,
      contentES: article.contentES,
      additionalInfoES: article.additionalInfoES,
      isTranslatedES: article.isTranslatedES,
    }));

    return new Response(JSON.stringify(transformedArticles), { status: 200 });
  } catch (error) {
    console.error("❌ Error en GET /api/articles:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Leer datos desde FormData
    const formData = await request.formData();

    const title = formData.get("title");
    const subtitle = formData.get("subtitle");
    const previewText = formData.get("previewText");
    const additionalInfo = formData.get("additionalInfo");
    const content = formData.get("content");
    const beitragstypId = formData.get("beitragstypId");
    const isPrinted = formData.get("isPrinted") === "true";
    const editionId = formData.get("editionId");
    let authors = [];
    try {
      const rawAuthors = formData.get("authors");
      if (rawAuthors) {
        authors = JSON.parse(rawAuthors.toString());
      }
    } catch (e) {
      console.error("❌ Error parseando autores:", e);
    }
    const interviewees = JSON.parse(formData.get("interviewees") || "[]");

    const startPage = formData.get("startPage");
    const endPage = formData.get("endPage");
    const publicationDateRaw = formData.get("publicationDate");

    // 🧠 Usar el isPublished que viene del frontend
    const isPublishedFromFrontend = formData.get("isPublished");
    let isPublished = isPublishedFromFrontend === "true";

    let publicationDate = publicationDateRaw
      ? new Date(publicationDateRaw)
      : new Date();
    const categories = JSON.parse(formData.get("categories") || "[]");
    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");

    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Título, contenido y tipo de artículo son obligatorios.",
        }),
        { status: 400 }
      );
    }

    // ---------- legacyPath (SEO) SIN locale ----------
    const slug = slugify(title);

    let legacyPath;
    if (isPrinted && editionId) {
      // obtener número de edición para la URL
      const ed = await prisma.edition.findUnique({
        where: { id: parseInt(editionId, 10) },
        select: { number: true },
      });
      if (!ed) {
        return new Response(
          JSON.stringify({ error: "La edición especificada no existe." }),
          { status: 400 }
        );
      }
      // ✅ SIN "de/" ni "es/"
      legacyPath = `/ausgaben/${ed.number}/${slug}`;
    } else {
      // Artículo online (sin edición)
      // ✅ SIN "de/" ni "es/"
      legacyPath = `/online/${slug}`;
    }

    // Asegurar unicidad del legacyPath (por si existe mismo slug)
    let finalLegacyPath = legacyPath;
    const existing = await prisma.article.findUnique({
      where: { legacyPath: finalLegacyPath },
    });
    if (existing) {
      // sufijo corto para diferenciar
      finalLegacyPath = `${legacyPath}-${Date.now().toString(36).slice(-4)}`;
    }
    // --------------------------------------

    // **1️⃣ Crear el artículo**
    const article = await prisma.article.create({
      data: {
        title,
        subtitle,
        content,
        previewText: previewText || null,
        additionalInfo: additionalInfo || null,
        legacyPath: finalLegacyPath, // 👈 guardamos la URL SEO
        beitragstypId: parseInt(beitragstypId, 10),
        beitragssubtypId: formData.get("beitragssubtypId")
          ? parseInt(formData.get("beitragssubtypId"), 10)
          : null,
        isInPrintEdition: isPrinted,
        mediaTitle: formData.get("mediaTitle") || null,
        editionId: isPrinted ? parseInt(editionId, 10) : null,
        isPublished: isPublished,
        publicationDate: publicationDate
          ? new Date(publicationDate)
          : new Date(),
        startPage: startPage ? parseInt(startPage, 10) : null,
        endPage: endPage ? parseInt(endPage, 10) : null,
        authors: authors.length
          ? { connect: authors.map((id) => ({ id: parseInt(id, 10) })) }
          : undefined,
        interviewees: interviewees.length
          ? {
              connect: interviewees.map((id) => ({ id: parseInt(id, 10) })),
            }
          : undefined,
        categories: categories.length
          ? {
              connect: categories.map((categoryId) => ({ id: categoryId })),
            }
          : undefined,
        regions: regions.length
          ? { connect: regions.map((region) => ({ id: parseInt(region, 10) })) }
          : undefined,
        topics: topics.length
          ? { connect: topics.map((topic) => ({ id: parseInt(topic, 10) })) }
          : undefined,
      },
    });

    console.log("✅ Artículo creado:", article.id);
    // Log de actividad
    // **2️⃣ Log de actividad ahora que sí existe el artículo**
    if (formData.get("userId")) {
      // Obtener datos de edición si existe
      let editionData = null;
      if (article.editionId) {
        const ed = await prisma.edition.findUnique({
          where: { id: article.editionId },
          select: { number: true, title: true, datePublished: true }, // 👈 añadir
        });
        editionData = ed
          ? {
              number: ed.number,
              title: ed.title,
              datePublished: ed.datePublished, // 👈 incluir en metadata
            }
          : null;
      }

      await prisma.activityLog.create({
        data: {
          userId: formData.get("userId"),
          articleId: article.id,
          action: "CREATE_ARTICLE",
          metadata: JSON.stringify({
            title: article.title,
            legacyPath: article.legacyPath,
            edition: editionData,
            createdAt: new Date().toISOString(),
          }),
        },
      });
    }

    // **2️⃣ Procesar galería de imágenes** (N imágenes)
    try {
      // Detectar índices de gallery presentes en el FormData: gallery[0][file], gallery[0][title], etc.
      const galleryIndices = new Set();
      for (const key of formData.keys()) {
        const m = key.match(/^gallery\[(\d+)\]\[(file|title|alt|isCover)\]$/);
        if (m) galleryIndices.add(parseInt(m[1], 10));
      }

      const sortedIdx = Array.from(galleryIndices).sort((a, b) => a - b);
      let imagesUploaded = 0;

      for (const idx of sortedIdx) {
        const file = formData.get(`gallery[${idx}][file]`);
        const title = formData.get(`gallery[${idx}][title]`) || null;
        const alt = formData.get(`gallery[${idx}][alt]`) || null;

        if (!file || !file.name) continue;

        try {
          // Subir al servidor local
          const { url } = await uploadFile(file, "images");

          // Guardar en BD
          await prisma.image.create({
            data: {
              contentType: "ARTICLE",
              contentId: article.id,
              url,
              title,
              alt,
            },
          });

          imagesUploaded += 1;
        } catch (imgErr) {
          Sentry.captureException(imgErr);
          console.error(
            `❌ Error subiendo/guardando imagen idx=${idx}:`,
            imgErr
          );
        }
      }

      console.log(`✅ Galería procesada. Imágenes subidas: ${imagesUploaded}`);
    } catch (galErr) {
      console.error("❌ Error procesando la galería:", galErr);
    }

    // 🖼️ Registrar imágenes inline (subidas desde el editor de contenido)
    try {
      const inlineRaw = formData.get("inlineImageUrls");
      if (inlineRaw) {
        const inlineUrls = JSON.parse(inlineRaw);
        for (const url of inlineUrls) {
          await prisma.image.create({
            data: { contentType: "ARTICLE_INLINE", contentId: article.id, url },
          });
        }
      }
    } catch (inlineErr) {
      console.error("❌ Error registrando imágenes inline:", inlineErr);
    }

    // **4️⃣ Procesar PDFs adjuntos**
    try {
      const pdfIndices = new Set();
      for (const key of formData.keys()) {
        const m = key.match(/^pdfs\[(\d+)\]\[(file|title)\]$/);
        if (m) pdfIndices.add(parseInt(m[1], 10));
      }
      for (const idx of Array.from(pdfIndices).sort((a, b) => a - b)) {
        const file = formData.get(`pdfs[${idx}][file]`);
        const title = formData.get(`pdfs[${idx}][title]`) || "";
        if (!file || !file.name) continue;
        const { url: pdfUrl } = await uploadFile(file, "pdfs-public");
        await prisma.articlePdf.create({
          data: { articleId: article.id, url: pdfUrl, title },
        });
      }
    } catch (pdfErr) {
      Sentry.captureException(pdfErr);
      console.error("❌ Error procesando PDFs:", pdfErr);
    }

    // **5️⃣ Retornar el artículo con sus imágenes**
    const images = await prisma.image.findMany({
      where: { contentType: "ARTICLE", contentId: article.id },
    });

    return new Response(
      JSON.stringify({
        ...article,
        images, // 👈 todas las imágenes subidas
      }),
      { status: 201 }
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error("❌ Error al crear el artículo:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
