import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const locale = searchParams.get("locale") || "de";

    // ✅ Extraer filtros avanzados
    const regionsFilter =
      searchParams.get("regions")?.split(",").map(Number).filter(Boolean) || [];
    const topicsFilter =
      searchParams.get("topics")?.split(",").map(Number).filter(Boolean) || [];
    const typesFilter =
      searchParams.get("types")?.split(",").map(Number).filter(Boolean) || [];
    const yearFilter = searchParams.get("year");

    if (!query || query.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Se requiere un término de búsqueda" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const searchQuery = query.trim();

    // 🔨 Construir condiciones base según locale
    let whereConditions = {
      isPublished: true,
    };

    // Condiciones de búsqueda de texto según idioma
    if (locale === "es") {
      whereConditions.isTranslatedES = true;
      whereConditions.needsReviewES = false;
      whereConditions.OR = [
        { titleES: { contains: searchQuery } },
        { subtitleES: { contains: searchQuery } },
        { contentES: { contains: searchQuery } },
        { authors: { some: { name: { contains: searchQuery } } } },
        { interviewees: { some: { name: { contains: searchQuery } } } },
      ];
    } else {
      whereConditions.OR = [
        { title: { contains: searchQuery } },
        { subtitle: { contains: searchQuery } },
        { content: { contains: searchQuery } },
        { authors: { some: { name: { contains: searchQuery } } } },
        { interviewees: { some: { name: { contains: searchQuery } } } },
      ];
    }

    // ✅ Agregar filtros avanzados (se combinan con AND)
    if (regionsFilter.length > 0) {
      whereConditions.regions = {
        some: { id: { in: regionsFilter } },
      };
    }

    if (topicsFilter.length > 0) {
      whereConditions.topics = {
        some: { id: { in: topicsFilter } },
      };
    }

    if (typesFilter.length > 0) {
      whereConditions.beitragstypId = {
        in: typesFilter,
      };
    }

    if (yearFilter) {
      const year = parseInt(yearFilter);
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      whereConditions.publicationDate = {
        gte: startDate,
        lte: endDate,
      };

      // ✅ LOG TEMPORAL: Ver fechas generadas
      console.log("📅 Filtro de año aplicado:", {
        year: yearFilter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }

    console.log("🔎 Búsqueda:", searchQuery, "Locale:", locale);
    console.log("🔧 Filtros aplicados:", {
      regions: regionsFilter,
      topics: topicsFilter,
      types: typesFilter,
      year: yearFilter,
    });

    // ✅ LOG TEMPORAL: Ver condiciones completas
    console.log(
      "🔧 whereConditions:",
      JSON.stringify(whereConditions, null, 2)
    );

    // 📊 Buscar artículos
    const articles = await prisma.article.findMany({
      where: whereConditions,
      orderBy: { publicationDate: "desc" },
      skip: offset,
      take: limit,
      include: {
        regions: true,
        topics: true,
        authors: { select: { id: true, name: true } },
        interviewees: { select: { id: true, name: true } },
        categories: true,
        beitragstyp: { select: { id: true, name: true } },
        edition: { select: { title: true, number: true } },
      },
    });

    // ✅ LOG TEMPORAL: Ver fechas de artículos encontrados
    if (articles.length > 0) {
      console.log("📰 Primeros 3 artículos encontrados con sus fechas:");
      articles.slice(0, 3).forEach((article) => {
        console.log(
          `  - ${article.title?.substring(0, 50)}... → ${article.publicationDate}`
        );
      });
    }

    // 📸 Agregar imágenes
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: article.beitragsId || article.id,
          },
        });
        return { ...article, images };
      })
    );

    // 🔢 Contar total
    const totalArticles = await prisma.article.count({
      where: whereConditions,
    });

    console.log("✅ Resultados encontrados:", totalArticles);

    return new Response(
      JSON.stringify({
        articles: articlesWithImages,
        totalArticles,
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error en la búsqueda:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
