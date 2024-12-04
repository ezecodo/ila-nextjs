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
      },
      orderBy: { id: "desc" },
    });

    return new Response(JSON.stringify(articles), { status: 200 });
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
      isPublished, // Publicar ahora
      publicationDate, // Fecha de publicación programada
      isNachruf, // Nuevo: Es Nachruf
      deceasedFirstName, // Nuevo: Nombre del fallecido
      deceasedLastName, // Nuevo: Apellido del fallecido
      dateOfBirth, // Nuevo: Fecha de nacimiento
      dateOfDeath, // Nuevo: Fecha de defunción
      previewText, // Vorschau Text
    } = await request.json();

    console.log("Payload recibido:", {
      title,
      content,
      beitragstypId,
      previewText,
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
    // Crear el artículo
    const article = await prisma.article.create({
      data: {
        title,
        subtitle,
        content,
        beitragstypId: parseInt(beitragstypId, 10),
        beitragssubtypId: beitragssubtypId
          ? parseInt(beitragssubtypId, 10)
          : null,
        isInPrintEdition: isPrinted,
        editionId: isPrinted ? parseInt(editionId, 10) : null,
        startPage: isPrinted ? parseInt(startPage, 10) : null,
        endPage: isPrinted ? parseInt(endPage, 10) : null,
        isPublished: isPublished || false, // Publicar ahora si está configurado
        publicationDate: publicationDate ? new Date(publicationDate) : null, // Fecha programada si corresponde
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
                dateOfBirth: parseInt(dateOfBirth, 10), // Almacena directamente como número entero
                dateOfDeath: parseInt(dateOfDeath, 10), // Almacena directamente como número entero
              },
            }
          : undefined,
        previewText: validPreviewText,
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
