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
    // Rango de años para la línea de tiempo (YearTimeline, mismo componente que
    // /related/[articleId]) — tiene prioridad sobre `year` (el <select> clásico de
    // AdvancedSearchFilters) si vinieran los dos.
    const yearFromFilter = searchParams.get("yearFrom");
    const yearToFilter = searchParams.get("yearTo");

    // Sin query = listado de todos los artículos publicados (click en el stat "Artikel"
    // del banner de archivo, ver STAT_HREF en blocks.js) — antes tiraba 400 y no había
    // forma de "ver todos" sin escribir algo en el buscador.
    const searchQuery = (query || "").trim();
    const hasQuery = searchQuery !== "";

    // 🔨 Construir condiciones base según locale
    let whereConditions = {
      isPublished: true,
    };

    // Condiciones de búsqueda de texto según idioma (solo si hay término)
    if (locale === "es") {
      whereConditions.isTranslatedES = true;
      whereConditions.needsReviewES = false;
      if (hasQuery) {
        whereConditions.OR = [
          { titleES: { contains: searchQuery } },
          { subtitleES: { contains: searchQuery } },
          { contentES: { contains: searchQuery } },
          { authors: { some: { name: { contains: searchQuery } } } },
          { interviewees: { some: { name: { contains: searchQuery } } } },
        ];
      }
    } else if (hasQuery) {
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

    // 📊 Histograma de años para la timeline (YearTimeline) — se calcula ANTES de aplicar
    // el filtro de año, sobre las mismas condiciones de texto/región/tema/tipo, para que
    // el histograma siempre muestre la distribución completa aunque el rango esté acotado
    // (mismo criterio que /api/articles/related en modo "all"). Consulta liviana (solo
    // fecha) — el tope es generoso a propósito: hoy el archivo entero son ~5300
    // artículos publicados, lejos del límite.
    const yearRows = await prisma.article.findMany({
      where: whereConditions,
      select: { publicationDate: true },
      take: 20000,
    });
    // ila existe desde 1976 (mismo FOUNDING_YEAR que /api/stats/site) — año-piso para
    // filtrar fechas basura de datos migrados (ej. artículo 22813, publicationDate quedó
    // en el año 0014 en vez de 2014). No se toca el dato en sí, solo se lo saca del
    // histograma para no reventar el rango de la timeline.
    const FOUNDING_YEAR = 1976;
    const currentYear = new Date().getFullYear();
    const yearCountMap = {};
    for (const row of yearRows) {
      if (!row.publicationDate) continue;
      const y = new Date(row.publicationDate).getFullYear();
      if (y < FOUNDING_YEAR || y > currentYear + 1) continue;
      yearCountMap[y] = (yearCountMap[y] || 0) + 1;
    }
    const yearCounts = Object.keys(yearCountMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((year) => ({ year, count: yearCountMap[year] }));

    if (yearFromFilter || yearToFilter) {
      whereConditions.publicationDate = {
        ...(yearFromFilter && { gte: new Date(`${yearFromFilter}-01-01`) }),
        ...(yearToFilter && { lte: new Date(`${yearToFilter}-12-31`) }),
      };
    } else if (yearFilter) {
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
        yearCounts,
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
