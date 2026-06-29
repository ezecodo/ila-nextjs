import { prisma } from "@/lib/prisma";

// Dossiers (editions) relacionados a uno dado. Híbrido (opción B): el
// etiquetado a nivel Edition es flojo, pero los ARTÍCULOS están muy bien
// taggeados. Por eso la señal de regiones/temas se agrega de los artículos del
// dossier (más las del propio Edition) de AMBOS lados — origen y candidatos.
// Scoring: región pesa 2, tema pesa 1. Solo dossiers con portada.
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

  // Une las regiones/temas del propio Edition + las de todos sus artículos.
  const aggregate = (edition) => {
    const regionMap = new Map(); // id → name (para mostrar)
    const topicSet = new Set();
    edition.regions.forEach((r) => regionMap.set(r.id, r.name));
    edition.topics.forEach((t) => topicSet.add(t.id));
    (edition.articles || []).forEach((a) => {
      a.regions.forEach((r) => regionMap.set(r.id, r.name));
      a.topics.forEach((t) => topicSet.add(t.id));
    });
    return { regionMap, topicSet };
  };

  try {
    const tagSelect = {
      regions: { select: { id: true, name: true } },
      topics: { select: { id: true } },
    };

    const current = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        ...tagSelect,
        articles: { select: tagSelect },
      },
    });

    if (!current) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { regionMap: srcRegions, topicSet: srcTopics } = aggregate(current);
    const regionIds = [...srcRegions.keys()];
    const topicIds = [...srcTopics];

    if (!regionIds.length && !topicIds.length) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Candidatos: dossiers (con portada) cuyas regiones/temas — propios o de sus
    // artículos — intersecan con los del origen. Pool acotado y reciente.
    const candidates = await prisma.edition.findMany({
      where: {
        id: { not: editionId },
        coverImage: { not: null },
        OR: [
          { regions: { some: { id: { in: regionIds } } } },
          { topics: { some: { id: { in: topicIds } } } },
          { articles: { some: { regions: { some: { id: { in: regionIds } } } } } },
          { articles: { some: { topics: { some: { id: { in: topicIds } } } } } },
        ],
      },
      select: {
        id: true,
        number: true,
        title: true,
        titleES: true,
        subtitle: true,
        subtitleES: true,
        isTranslatedES: true,
        coverImage: true,
        datePublished: true,
        ...tagSelect,
        articles: { select: tagSelect },
      },
      orderBy: { datePublished: "desc" },
      take: 80,
    });

    const scored = candidates
      .map((c) => {
        const { regionMap, topicSet } = aggregate(c);
        let sharedRegions = 0;
        for (const id of regionMap.keys()) if (srcRegions.has(id)) sharedRegions++;
        let sharedTopics = 0;
        for (const id of topicSet) if (srcTopics.has(id)) sharedTopics++;
        // Región para mostrar: una propia compartida, o la primera agregada.
        const displayRegion =
          [...regionMap.entries()].find(([id]) => srcRegions.has(id)) ||
          [...regionMap.entries()][0] ||
          null;
        return {
          c,
          score: sharedRegions * 2 + sharedTopics,
          displayRegion: displayRegion
            ? { id: displayRegion[0], name: displayRegion[1] }
            : null,
        };
      })
      .filter((s) => s.score > 0)
      .sort((x, y) => {
        if (y.score !== x.score) return y.score - x.score;
        const dx = x.c.datePublished ? new Date(x.c.datePublished).getTime() : 0;
        const dy = y.c.datePublished ? new Date(y.c.datePublished).getTime() : 0;
        return dy - dx;
      })
      .slice(0, limit);

    const result = scored.map(({ c, displayRegion }) => ({
      id: c.id,
      number: c.number,
      title: c.title,
      titleES: c.titleES,
      subtitle: c.subtitle,
      subtitleES: c.subtitleES,
      isTranslatedES: c.isTranslatedES,
      coverImage: c.coverImage,
      datePublished: c.datePublished,
      regions: displayRegion ? [displayRegion] : [],
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
