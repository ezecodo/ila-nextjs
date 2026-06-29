import { prisma } from "@/lib/prisma";

// Dossiers (editions) relacionados a uno dado. Espejo de /api/articles/related
// (modo rail): 1º región compartida, luego ranking por nº de temas (topics)
// compartidos; si faltan, se completa con dossiers que comparten solo temas.
// Solo devuelve dossiers CON portada (la UI es un carrusel de portadas).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const editionId = parseInt(searchParams.get("editionId"), 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "8", 10), 12);

  if (!editionId || isNaN(editionId)) {
    return new Response(JSON.stringify({ error: "editionId inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const current = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        regions: { select: { id: true } },
        topics: { select: { id: true } },
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
    const topicSet = new Set(topicIds);

    const baseWhere = {
      id: { not: editionId },
      coverImage: { not: null },
    };

    const selectFields = {
      id: true,
      number: true,
      title: true,
      titleES: true,
      subtitle: true,
      subtitleES: true,
      isTranslatedES: true,
      coverImage: true,
      datePublished: true,
      regions: { select: { id: true, name: true } },
      topics: { select: { id: true } },
    };

    // Candidatos por región (relación primaria), rankeados por temas en común.
    const regionPool = regionIds.length
      ? await prisma.edition.findMany({
          where: { ...baseWhere, regions: { some: { id: { in: regionIds } } } },
          select: selectFields,
          orderBy: { datePublished: "desc" },
          take: 40,
        })
      : [];

    const scored = regionPool
      .map((e) => ({
        edition: e,
        sharedTopics: e.topics.filter((t) => topicSet.has(t.id)).length,
      }))
      .sort((x, y) => {
        if (y.sharedTopics !== x.sharedTopics)
          return y.sharedTopics - x.sharedTopics;
        const dx = x.edition.datePublished
          ? new Date(x.edition.datePublished).getTime()
          : 0;
        const dy = y.edition.datePublished
          ? new Date(y.edition.datePublished).getTime()
          : 0;
        return dy - dx;
      })
      .map((s) => s.edition);

    let selected = scored.slice(0, limit);

    // Completar con dossiers que comparten solo temas, si faltan.
    if (selected.length < limit && topicIds.length) {
      const excludeIds = new Set([editionId, ...selected.map((e) => e.id)]);
      const topicPool = await prisma.edition.findMany({
        where: {
          ...baseWhere,
          id: { notIn: Array.from(excludeIds) },
          topics: { some: { id: { in: topicIds } } },
        },
        select: selectFields,
        orderBy: { datePublished: "desc" },
        take: limit - selected.length,
      });
      selected = [...selected, ...topicPool];
    }

    const result = selected.map((e) => ({
      id: e.id,
      number: e.number,
      title: e.title,
      titleES: e.titleES,
      subtitle: e.subtitle,
      subtitleES: e.subtitleES,
      isTranslatedES: e.isTranslatedES,
      coverImage: e.coverImage,
      datePublished: e.datePublished,
      regions: e.regions,
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en /api/editions/related:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
