import { prisma } from "@/lib/prisma";

// Artículos relacionados a uno dado.
// Relevancia: 1º región compartida, luego se rankea por nº de temas (topics)
// compartidos. Si no alcanzan los de región, se completa con artículos que
// comparten solo temas.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const articleId = parseInt(searchParams.get("articleId"), 10);
  const locale = searchParams.get("locale");
  const limit = Math.min(parseInt(searchParams.get("limit") || "4", 10), 12);

  // Modo "all": página dedicada con todos los relacionados, paginados y
  // filtrables por rango de años (edition.datePublished). Devuelve un objeto
  // { items, total, years, page, pageSize } en vez del array del rail.
  const allMode = searchParams.get("all") === "true";
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") || "24", 10), 1),
    48,
  );
  const yearFrom = parseInt(searchParams.get("yearFrom") || "", 10);
  const yearTo = parseInt(searchParams.get("yearTo") || "", 10);

  // Facetas activas (chips). Si `facets=1` el cliente manda una selección
  // explícita (regions/topics/authors); si falta, se usan TODAS las del
  // artículo origen (comportamiento por defecto, primera carga).
  const facetsExplicit = searchParams.get("facets") === "1";
  const parseIdList = (key) =>
    (searchParams.get(key) || "")
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
  const reqRegionIds = parseIdList("regions");
  const reqTopicIds = parseIdList("topics");
  const reqAuthorIds = parseIdList("authors");

  if (!articleId || isNaN(articleId)) {
    return new Response(JSON.stringify({ error: "articleId inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const current = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        titleES: true,
        isTranslatedES: true,
        legacyPath: true,
        regions: { select: { id: true, name: true } },
        topics: { select: { id: true, name: true } },
        authors: { select: { id: true, name: true } },
      },
    });

    if (!current) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const regionIds = current.regions.map((r) => r.id);
    const topicIds = current.topics.map((t) => t.id);
    const authorIds = current.authors.map((a) => a.id);
    const topicSet = new Set(topicIds);

    const source = {
      id: current.id,
      title: current.title,
      titleES: current.titleES,
      isTranslatedES: current.isTranslatedES,
      legacyPath: current.legacyPath,
      regions: current.regions,
      topics: current.topics,
      authors: current.authors,
    };

    // Facetas efectivas para el modo "all": las que el cliente marcó como
    // activas, o todas las del origen si no mandó selección explícita.
    // Se intersecan con las del origen para no aceptar IDs ajenos.
    const activeRegionIds = facetsExplicit
      ? reqRegionIds.filter((id) => regionIds.includes(id))
      : regionIds;
    const activeTopicIds = facetsExplicit
      ? reqTopicIds.filter((id) => topicIds.includes(id))
      : topicIds;
    const activeAuthorIds = facetsExplicit
      ? reqAuthorIds.filter((id) => authorIds.includes(id))
      : authorIds;

    const now = new Date();
    const baseWhere = {
      isPublished: true,
      id: { not: articleId },
      OR: [{ publicationDate: null }, { publicationDate: { lte: now } }],
      ...(locale === "es"
        ? { isTranslatedES: true, needsReviewES: false }
        : {}),
    };

    const selectFields = {
      id: true,
      title: true,
      titleES: true,
      subtitle: true,
      subtitleES: true,
      isTranslatedES: true,
      legacyPath: true,
      beitragsId: true,
      publicationDate: true,
      authors: { select: { id: true, name: true } },
      topics: { select: { id: true } },
      edition: { select: { id: true, number: true, datePublished: true } },
    };

    // Excerpt de respaldo para cards sin imagen (solo modo "all"): se arma del
    // teaser o, si falta, del cuerpo del artículo; se limpia el HTML. Los campos
    // de texto solo se piden en el modo "all", así que en el rail queda null.
    const isES = locale === "es";
    const makeExcerpt = (a) => {
      const raw = isES
        ? a.previewTextES || a.contentES || a.previewText || a.content
        : a.previewText || a.content;
      if (!raw) return null;
      const text = raw
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return text ? text.slice(0, 600) : null;
    };

    const attachImage = async (a) => {
      const contentId = a.beitragsId || a.id;
      const image = await prisma.image.findFirst({
        where: { contentType: "ARTICLE", contentId },
        orderBy: { id: "asc" },
        select: { url: true, alt: true },
      });
      return {
        id: a.id,
        title: a.title,
        titleES: a.titleES,
        subtitle: a.subtitle,
        subtitleES: a.subtitleES,
        isTranslatedES: a.isTranslatedES,
        legacyPath: a.legacyPath,
        authors: a.authors,
        edition: a.edition,
        image: image || null,
        excerpt: makeExcerpt(a),
      };
    };

    // === Modo "all": todos los relacionados, cronológico, filtrable por año ===
    if (allMode) {
      // Conjunto de relacionados = unión (OR) de las facetas activas:
      // comparte alguna región activa, o algún tema activo, o es del autor activo.
      const relatedOr = [];
      if (activeRegionIds.length)
        relatedOr.push({ regions: { some: { id: { in: activeRegionIds } } } });
      if (activeTopicIds.length)
        relatedOr.push({ topics: { some: { id: { in: activeTopicIds } } } });
      if (activeAuthorIds.length)
        relatedOr.push({ authors: { some: { id: { in: activeAuthorIds } } } });

      if (relatedOr.length === 0) {
        // Sin facetas activas no hay criterio → vacío (el cliente avisa).
        return new Response(
          JSON.stringify({ items: [], total: 0, years: [], yearCounts: [], page, pageSize, source }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const allWhere = { ...baseWhere, AND: [{ OR: relatedOr }] };

      // Escaneo ligero (solo fechas) para años disponibles y filtrado por rango.
      const lightRows = await prisma.article.findMany({
        where: allWhere,
        select: {
          id: true,
          edition: { select: { datePublished: true } },
        },
        orderBy: { publicationDate: "desc" },
        take: 1000,
      });

      const yearOf = (row) =>
        row.edition?.datePublished
          ? new Date(row.edition.datePublished).getFullYear()
          : null;

      const years = Array.from(
        new Set(lightRows.map(yearOf).filter((y) => y !== null)),
      ).sort((a, b) => b - a);

      // Distribución por año (set completo, sin filtrar) → histograma de la
      // timeline. Ascendente (izq = más antiguo) y estable entre requests.
      const countMap = {};
      for (const row of lightRows) {
        const y = yearOf(row);
        if (y !== null) countMap[y] = (countMap[y] || 0) + 1;
      }
      const yearCounts = Object.keys(countMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((y) => ({ year: y, count: countMap[y] }));

      const filtered = lightRows.filter((row) => {
        const y = yearOf(row);
        if (!isNaN(yearFrom) && (y === null || y < yearFrom)) return false;
        if (!isNaN(yearTo) && (y === null || y > yearTo)) return false;
        return true;
      });

      const total = filtered.length;
      const pageIds = filtered
        .slice((page - 1) * pageSize, page * pageSize)
        .map((r) => r.id);

      const pageArticles = await prisma.article.findMany({
        where: { id: { in: pageIds } },
        select: {
          ...selectFields,
          previewText: true,
          previewTextES: true,
          content: true,
          contentES: true,
        },
        orderBy: { publicationDate: "desc" },
      });

      const items = await Promise.all(pageArticles.map(attachImage));

      return new Response(
        JSON.stringify({ items, total, years, yearCounts, page, pageSize, source }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Candidatos por región (relación primaria)
    const regionPool = regionIds.length
      ? await prisma.article.findMany({
          where: {
            ...baseWhere,
            regions: { some: { id: { in: regionIds } } },
          },
          select: selectFields,
          orderBy: { publicationDate: "desc" },
          take: 40,
        })
      : [];

    const scored = regionPool
      .map((a) => ({
        article: a,
        sharedTopics: a.topics.filter((t) => topicSet.has(t.id)).length,
      }))
      .sort((x, y) => {
        if (y.sharedTopics !== x.sharedTopics)
          return y.sharedTopics - x.sharedTopics;
        const dx = x.article.publicationDate
          ? new Date(x.article.publicationDate).getTime()
          : 0;
        const dy = y.article.publicationDate
          ? new Date(y.article.publicationDate).getTime()
          : 0;
        return dy - dx;
      })
      .map((s) => s.article);

    let selected = scored.slice(0, limit);

    // Completar con artículos que comparten solo temas, si faltan
    if (selected.length < limit && topicIds.length) {
      const excludeIds = new Set([articleId, ...selected.map((a) => a.id)]);
      const topicPool = await prisma.article.findMany({
        where: {
          ...baseWhere,
          id: { notIn: Array.from(excludeIds) },
          topics: { some: { id: { in: topicIds } } },
        },
        select: selectFields,
        orderBy: { publicationDate: "desc" },
        take: limit - selected.length,
      });
      selected = [...selected, ...topicPool];
    }

    // Adjuntar imagen de portada (primera imagen del artículo)
    const withImages = await Promise.all(selected.map(attachImage));

    return new Response(JSON.stringify(withImages), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en /api/articles/related:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
