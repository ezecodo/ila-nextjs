import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            number: true,
            title: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
          },
        },
        regions: {
          select: {
            id: true,
            name: true, // Incluir el nombre de las regiones
          },
        },
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true, // Incluir el nombre de las categorías
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    // Transformar los datos para incluir solo el nombre de las categorías
    const transformedArticles = articles.map((article) => ({
      ...article,
      categories: article.articleCategories.map((ac) => ({
        id: ac.category.id,
        name: ac.category.name, // Mostrar el nombre de la categoría
      })),
      articleCategories: undefined, // Eliminar el campo redundante
    }));

    return new Response(JSON.stringify(transformedArticles), { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/articles:", error.message);
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
    const {
      title,
      subtitle,
      content,
      beitragstypId,
      beitragssubtypId,
      isPrinted,
      editionId,
      startPage,
      endPage,
      authorId,
      intervieweeId,
      isPublished,
      publicationDate,
      isNachruf,
      deceasedFirstName,
      deceasedLastName,
      dateOfBirth,
      dateOfDeath,
      previewText,
      additionalInfo,
      categories,
      regionId,
    } = await request.json();

    console.log("Payload recibido:", {
      title,
      content,
      beitragstypId,
      regionId,
      categories,
    });

    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Título, contenido y tipo de artículo son obligatorios.",
        }),
        { status: 400 }
      );
    }

    if (!isPublished && !publicationDate) {
      return new Response(
        JSON.stringify({
          error:
            "Debe seleccionar 'Publicar ahora' o proporcionar una fecha para programar la publicación.",
        }),
        { status: 400 }
      );
    }

    // Validación de datos de Nachruf
    if (isNachruf) {
      if (
        !deceasedFirstName ||
        !deceasedLastName ||
        !dateOfBirth ||
        !dateOfDeath ||
        isNaN(parseInt(dateOfBirth, 10)) ||
        isNaN(parseInt(dateOfDeath, 10))
      ) {
        return new Response(
          JSON.stringify({
            error: "Los datos del Nachruf son inválidos o están incompletos.",
          }),
          { status: 400 }
        );
      }

      if (parseInt(dateOfBirth, 10) > parseInt(dateOfDeath, 10)) {
        return new Response(
          JSON.stringify({
            error:
              "El año de nacimiento no puede ser mayor que el año de defunción.",
          }),
          { status: 400 }
        );
      }
    }

    const validPreviewText =
      previewText && previewText.trim() !== "" ? previewText : null;

    if (additionalInfo && typeof additionalInfo !== "string") {
      return new Response(
        JSON.stringify({
          error: "El campo 'Información Adicional' debe ser un texto.",
        }),
        { status: 400 }
      );
    }

    // Crear el artículo
    const article = await prisma.article.create({
      data: {
        title,
        subtitle,
        content,
        additionalInfo: additionalInfo || null,
        beitragstypId: parseInt(beitragstypId, 10),
        beitragssubtypId: beitragssubtypId
          ? parseInt(beitragssubtypId, 10)
          : null,
        isInPrintEdition: isPrinted,
        editionId: isPrinted ? parseInt(editionId, 10) : null,
        startPage: isPrinted ? parseInt(startPage, 10) : null,
        endPage: isPrinted ? parseInt(endPage, 10) : null,
        isPublished: isPublished || false,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        authors: authorId
          ? {
              connect: { id: parseInt(authorId, 10) },
            }
          : undefined,
        interviewees: intervieweeId
          ? {
              connect: { id: parseInt(intervieweeId, 10) },
            }
          : undefined,
        obituaryDetails: isNachruf
          ? {
              create: {
                deceasedFirstName,
                deceasedLastName,
                dateOfBirth: parseInt(dateOfBirth, 10),
                dateOfDeath: parseInt(dateOfDeath, 10),
              },
            }
          : undefined,
        articleCategories: categories?.length
          ? {
              create: categories.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        previewText: validPreviewText,
        regions: regionId
          ? {
              connect: { id: parseInt(regionId, 10) },
            }
          : undefined,
      },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error al crear el artículo:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}
