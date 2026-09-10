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
      // 🔒 Si pertenece a un Dossier, ese Dossier debe estar publicado
      // (dossiers en borrador se cargan de antemano, ver Edition.isPublished).
      // Va en AND aparte porque más abajo whereConditions.OR se usa para el
      // texto de búsqueda — no se pueden pisar los dos usando la misma key.
      AND: [{ OR: [{ editionId: null }, { edition: { isPublished: true } }] }],
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

    const INCLUDE_FULL = {
      regions: true,
      topics: true,
      authors: { select: { id: true, name: true } },
      interviewees: { select: { id: true, name: true } },
      categories: true,
      beitragstyp: { select: { id: true, name: true } },
      edition: { select: { title: true, number: true } },
    };

    let articles;
    let totalArticles;

    if (hasQuery) {
      // 🎯 Relevancia — sin esto, ordenar solo por fecha hace que una mención de pasada
      // (una bibliografía, un exilio nombrado al margen) le gane a un artículo realmente
      // sobre el tema buscado con solo que sea más reciente. Feedback real: buscar
      // "uruguay" devolvía primero artículos sobre Kuba/Brasil que solo lo nombraban una
      // vez en el cuerpo, antes que los artículos etiquetados con la región Uruguay.
      //
      // Estrategia: traer los candidatos livianos (sin el campo `content`, pesado — HTML
      // completo del artículo) que ya matchearon por el WHERE de arriba, puntuarlos según
      // EN QUÉ CAMPO apareció el término, y recién ahí paginar. Si el término no aparece en
      // ninguno de los campos livianos que chequeamos (título/subtítulo/autor/entrevistado),
      // tiene que haber matcheado por `content` — es el único campo del OR que no
      // revisamos acá, así que no hace falta traerlo para confirmarlo. El campo pesado
      // (con imágenes) recién se trae después, solo para los IDs de la página actual —
      // igual que ya hacía este endpoint para la paginación.
      const candidates = await prisma.article.findMany({
        where: whereConditions,
        select: {
          id: true,
          title: true,
          titleES: true,
          subtitle: true,
          subtitleES: true,
          publicationDate: true,
          authors: { select: { name: true } },
          interviewees: { select: { name: true } },
          regions: { select: { name: true, nameES: true } },
          topics: { select: { name: true, nameES: true } },
        },
        take: 20000, // mismo tope generoso que el histograma de años, arriba
      });

      const norm = (s) => (s || "").toLowerCase();
      const nq = norm(searchQuery);
      const titleOf = (a) => (locale === "es" ? a.titleES || a.title : a.title);
      const subtitleOf = (a) => (locale === "es" ? a.subtitleES || a.subtitle : a.subtitle);
      const entityNameOf = (e) => (locale === "es" ? e.nameES || e.name : e.name);

      // Título > etiqueta de región/tema > subtítulo > autor/entrevistado > solo en el
      // cuerpo. Un match de título es la señal más fuerte de "esto es sobre lo buscado";
      // una etiqueta de región/tema es casi tan fuerte (alguien clasificó el artículo así
      // a propósito); el cuerpo es la señal más débil (puede ser una mención al pasar).
      const SCORE = { title: 100, tag: 80, subtitle: 50, person: 40, content: 10 };

      const scored = candidates.map((a) => {
        let score = 0;
        if (norm(titleOf(a)).includes(nq)) score = Math.max(score, SCORE.title);
        if (
          a.regions.some((r) => norm(entityNameOf(r)).includes(nq)) ||
          a.topics.some((t) => norm(entityNameOf(t)).includes(nq))
        )
          score = Math.max(score, SCORE.tag);
        if (norm(subtitleOf(a)).includes(nq)) score = Math.max(score, SCORE.subtitle);
        if (
          a.authors.some((p) => norm(p.name).includes(nq)) ||
          a.interviewees.some((p) => norm(p.name).includes(nq))
        )
          score = Math.max(score, SCORE.person);
        if (score === 0) score = SCORE.content;
        return { id: a.id, score, publicationDate: a.publicationDate };
      });

      scored.sort((x, y) => {
        if (y.score !== x.score) return y.score - x.score;
        return new Date(y.publicationDate) - new Date(x.publicationDate);
      });

      totalArticles = scored.length;
      const pageIds = scored.slice(offset, offset + limit).map((s) => s.id);

      const pageArticles = await prisma.article.findMany({
        where: { id: { in: pageIds } },
        include: INCLUDE_FULL,
      });
      // findMany con id:{in:[...]} no conserva el orden de la lista — reordenar según el
      // puntaje ya calculado arriba.
      const orderOf = new Map(pageIds.map((id, i) => [id, i]));
      articles = pageArticles.sort((a, b) => orderOf.get(a.id) - orderOf.get(b.id));
    } else {
      // Sin texto de búsqueda no hay relevancia que calcular (no hay término contra el
      // cual puntuar) — orden cronológico simple, como antes, paginado directo en la DB.
      articles = await prisma.article.findMany({
        where: whereConditions,
        orderBy: { publicationDate: "desc" },
        skip: offset,
        take: limit,
        include: INCLUDE_FULL,
      });
      totalArticles = await prisma.article.count({ where: whereConditions });
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
