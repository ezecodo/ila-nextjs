import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb", // Ajusta el límite según lo necesario
    },
  },
};

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const isPrinted = formData.get("isPrinted") === "true";
    const editionId = formData.get("editionId");
    const authorId = formData.get("authorId");
    const isPublished = formData.get("isPublished") === "true";
    const publicationDate = formData.get("publicationDate");
    const categories = JSON.parse(formData.get("categories") || "[]");
    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");
    const articleImage = formData.get("articleImage");

    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Título, contenido y tipo de artículo son obligatorios.",
        }),
        { status: 400 }
      );
    }

    // **1️⃣ Crear el artículo primero**
    const article = await prisma.article.create({
      data: {
        title,
        subtitle,
        content,
        beitragstypId: parseInt(beitragstypId, 10),
        isInPrintEdition: isPrinted,
        editionId: isPrinted ? parseInt(editionId, 10) : null,
        isPublished: isPublished,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        authors: authorId
          ? { connect: { id: parseInt(authorId, 10) } }
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

    let imageUrl = null;

    // **2️⃣ Subir la imagen del artículo a Cloudinary**
    if (articleImage) {
      try {
        const buffer = Buffer.from(await articleImage.arrayBuffer());

        const uploadResult = await cloudinary.v2.uploader.upload(
          `data:image/jpeg;base64,${buffer.toString("base64")}`,
          {
            folder: "ila/articles",
            public_id: `article_${article.id}`,
            overwrite: true,
          }
        );

        imageUrl = uploadResult.secure_url;
        console.log("✅ Imagen del artículo subida a Cloudinary:", imageUrl);

        // **3️⃣ Guardar la imagen en la tabla `Image` con la relación `articleId = article.id`**
        await prisma.image.create({
          data: {
            contentType: "ARTICLE",
            contentId: article.id, // Relación con el artículo
            url: imageUrl,
            title: title,
          },
        });

        console.log(
          "✅ Imagen del artículo guardada en la BD con articleId:",
          article.id
        );
      } catch (error) {
        console.error(
          "❌ Error al subir la imagen del artículo a Cloudinary:",
          error.message
        );
      }
    }

    // **4️⃣ Retornar el artículo con la URL de la imagen**
    return new Response(
      JSON.stringify({
        ...article,
        articleImageUrl: imageUrl,
      }),
      { status: 201 }
    );
  } catch (error) {
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
