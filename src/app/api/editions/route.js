import { NextResponse } from "next/server";
import { uploadFile, toSlug } from "@/lib/localUpload";

import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // flags / filtros
    const current = searchParams.get("current");
    const admin = searchParams.get("admin") === "true";
    const year = searchParams.get("year");

    if (current === "true") {
      const edition = await prisma.edition.findFirst({
        where: { isCurrent: true },
        include: {
          regions: { select: { id: true, name: true, nameES: true } },
          topics: { select: { id: true, name: true, nameES: true } },
        },
      });
      return new Response(JSON.stringify(edition), { status: 200 });
    }

    // where dinámico (para filtrar por año si viene)
    // 🧭 Filtros dinámicos combinados correctamente
    let where = {};

    const translatorId = searchParams.get("translatorId");
    if (translatorId) {
      where.translatorId = translatorId;
    }
    // 👇 AQUÍ agregas las líneas NUEVAS (después de translatorId)
    const translated = searchParams.get("translated");
    if (translated === "true") {
      where.articles = {
        some: {
          isTranslatedES: true,
          needsReviewES: false,
        },
      };
    }
    if (year) {
      const y = Number(year);
      if (!Number.isNaN(y)) {
        where.datePublished = {
          gte: new Date(`${y}-01-01T00:00:00.000Z`),
          lte: new Date(`${y}-12-31T23:59:59.999Z`),
        };
      }
    }

    // 🟣 Filtro por estado(s) de traducción (p. ej. ?status=in_progress,submitted)
    const status = searchParams.get("status");
    if (status) {
      where.translationStatus = { in: status.split(",") };
    }
    // Orden seguro
    const allowedSortFields = new Set([
      "id",
      "number",
      "title",
      "subtitle",
      "datePublished",
      "isCurrent",
      "isAvailableToOrder",
      "createdAt",
    ]);
    const sortField = searchParams.get("sortField") || "number";
    const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase();
    const orderBy = allowedSortFields.has(sortField)
      ? { [sortField]: sortOrder === "asc" ? "asc" : "desc" }
      : { number: "desc" };

    // Si viene admin=true → devolvemos paginado { items, totalPages }
    if (admin) {
      const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
      const limit = Math.min(
        Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
        100
      );
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        prisma.edition.count({ where }),
        prisma.edition.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            translator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            regions: { select: { id: true, name: true, nameES: true } },
            topics: { select: { id: true, name: true, nameES: true } },
            editionPdf: { select: { pdfUrl: true, fileSize: true, uploadedAt: true } },
          },
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return new Response(JSON.stringify({ items, totalPages, page, total }), {
        status: 200,
      });
    }

    // Público (sin admin) → lista plana
    const editions = await prisma.edition.findMany({
      where,
      orderBy,
      include: {
        regions: { select: { id: true, name: true, nameES: true } },
        topics: { select: { id: true, name: true, nameES: true } },
      },
    });

    return new Response(JSON.stringify(editions), { status: 200 });
  } catch (error) {
    console.error("Error fetching editions:", error);
    return new Response(JSON.stringify({ error: "Error fetching editions" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const number = parseInt(formData.get("number"), 10);
    const title = formData.get("title");
    const isAvailableToOrder = formData.get("isAvailableToOrder") === "true";
    const subtitle = formData.get("subtitle") || null;
    const datePublished = formData.get("datePublished");
    const summary = formData.get("summary");
    const tableOfContents = formData.get("tableOfContents") || null;
    const isCurrent = formData.get("isCurrent") === "true";

    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");

    const coverImageFile = formData.get("coverImage");

    // Validaciones básicas
    if (!number || !title || !summary) {
      console.error("Campos obligatorios faltantes:", {
        number,
        title,
        summary,
      });
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    console.log("Datos recibidos:", {
      number,
      title,
      subtitle,
      datePublished,
      summary,
      tableOfContents,
      isCurrent,
      regions,
      topics,
    });

    // Subir imagen de portada al servidor local
    const coverImagePath = coverImageFile
      ? (await uploadFile(coverImageFile, "images", `edition_${number}_${toSlug(title)}`)).url
      : null;

    console.log("URL de portada:", { coverImagePath });

    // Crear nueva edición en la base de datos
    const newEdition = await prisma.edition.create({
      data: {
        number,
        title,
        subtitle,
        datePublished: new Date(datePublished),
        summary,
        tableOfContents,
        isCurrent,
        coverImage: coverImagePath, // Guardar URL de Cloudinary
        isAvailableToOrder,
        regions: regions.length
          ? { connect: regions.map((id) => ({ id })) }
          : undefined,
        topics: topics.length
          ? { connect: topics.map((id) => ({ id })) }
          : undefined,
      },
      include: { regions: true, topics: true },
    });

    console.log("Edición creada exitosamente:", newEdition);

    return NextResponse.json(newEdition, { status: 201 });
  } catch (error) {
    console.error("Error al crear la edición:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
