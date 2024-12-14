import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_IMAGE_URL = "/uploads/fallback/default-article.jpg";

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
        regions: true, // Incluye las regiones asociadas
        topics: true, // Incluye los temas asociados
      },
      orderBy: { id: "desc" },
    });

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
    // Leer datos desde FormData
    const formData = await request.formData();

    const title = formData.get("title");
    const subtitle = formData.get("subtitle");
    const content = formData.get("content");
    const beitragstypId = formData.get("beitragstypId");
    const beitragssubtypId = formData.get("beitragssubtypId");
    const isPrinted = formData.get("isPrinted") === "true";
    const editionId = formData.get("editionId");
    const startPage = formData.get("startPage");
    const endPage = formData.get("endPage");
    const authorId = formData.get("authorId");
    const intervieweeId = formData.get("intervieweeId");
    const isPublished = formData.get("isPublished") === "true";
    const publicationDate = formData.get("publicationDate");
    const isNachruf = formData.get("isNachruf") === "true";
    const deceasedFirstName = formData.get("deceasedFirstName");
    const deceasedLastName = formData.get("deceasedLastName");
    const dateOfBirth = formData.get("dateOfBirth");
    const dateOfDeath = formData.get("dateOfDeath");
    const previewText = formData.get("previewText");
    const additionalInfo = formData.get("additionalInfo");
    const categories = JSON.parse(formData.get("categories") || "[]");
    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");

    console.log("Datos recibidos:", {
      title,
      subtitle,
      content,
      beitragstypId,
      regions,
      topics,
      categories,
    });

    // Validaciones básicas
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
        image: DEFAULT_IMAGE_URL, // Puedes manejar imágenes en otro momento si se suben
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
        articleCategories: categories.length
          ? {
              create: categories.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        previewText: previewText,
        regions: regions.length
          ? {
              connect: regions.map((region) => ({ id: parseInt(region, 10) })),
            }
          : undefined,
        topics: topics.length
          ? {
              connect: topics.map((topic) => ({ id: parseInt(topic, 10) })),
            }
          : undefined,
      },
      include: {
        regions: true,
        topics: true,
      },
    });

    console.log("Artículo creado:", article);

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error al crear el artículo:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}
