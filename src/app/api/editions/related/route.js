import { prisma } from "@/lib/prisma";

// Dossiers (editions) relacionados a uno dado — similitud TF-IDF (coseno).
//
// Cada dossier es un vector de "términos":
//   r<id> regiones y t<id> temas de sus artículos (+ los del propio Edition),
//   w<raíz> palabras del título/subtítulo del dossier.
// Peso de un término = (1 + log nº de artículos que lo llevan) × log(N / nº de
// dossiers que lo tienen). Así:
//   - lo que está en casi todos los dossiers (Lateinamerika, Menschenrechte,
//     USA…) vale casi cero — antes era lo que decidía el ranking;
//   - el tema central (en muchos artículos del dossier) pesa más que la nota
//     suelta de "Weitere Themen";
//   - el coseno no premia a un dossier por tener muchos tags distintos.
// El título suma porque el etiquetado por artículo es fragmentado (Rechtsruck vs
// Rechtspopulismus vs Ultrarechter Umbau) y el título suele nombrar el tema
// ("Rechte Netzwerke", "Rechter Rollback"). Calibrado con datos reales
// (2026-10-23): sin título, la ila 499 no encontraba ningún dossier sobre la derecha.

const TITLE_WEIGHT = 0.7;
const MIN_ARTICLES_FULL_SCORE = 4; // dossiers viejos con 1–3 artículos cargados
const CACHE_TTL_MS = 60 * 60 * 1000;

const STOPWORDS = new Set(
  "der die das und oder von vom zum zur mit für fur ohne aus auf über unter nach vor bei den dem des ein eine einer eines nicht noch auch wie was wer wir ihr sie sich als alle mehr zwischen gegen durch statt ila jahre jahr neue neuer neues heute".split(
    " ",
  ),
);

// Stemming mínimo para alemán: Rechter/Rechte → rechte, Frauen/Frau → frau.
// Deja "Recht" (Recht auf Stadt) separado de "rechte".
const stem = (w) =>
  w
    .replace(/innen$/, "")
    .replace(/ungen$/, "ung")
    .replace(/e[rs]$/, "e")
    .replace(/e?n$/, "");

const titleWords = (text) => [
  ...new Set(
    text
      .toLowerCase()
      .split(/[^a-zäöüßáéíóúñ]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
      .map(stem)
      .filter((w) => w.length >= 3),
  ),
];

let cache = null; // { at, editions: Map<id, info>, vectors: Map<id, Map<term, w>> }

async function buildIndex() {
  const tagSelect = {
    regions: { select: { id: true, name: true } },
    topics: { select: { id: true } },
  };
  const editions = await prisma.edition.findMany({
    where: { coverImage: { not: null } },
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
  });

  const regionNames = new Map();
  const tfs = new Map();
  for (const e of editions) {
    const tf = new Map();
    const add = (k, w) => tf.set(k, (tf.get(k) || 0) + w);
    for (const a of e.articles) {
      a.regions.forEach((r) => {
        regionNames.set(r.id, r.name);
        add(`r${r.id}`, 1);
      });
      a.topics.forEach((t) => add(`t${t.id}`, 1));
    }
    // Tags del propio Edition y palabras del título = el tema declarado del
    // dossier: cuentan como si estuvieran en la mitad de sus artículos.
    const boost = Math.max(1, e.articles.length / 2);
    e.regions.forEach((r) => {
      regionNames.set(r.id, r.name);
      add(`r${r.id}`, boost);
    });
    e.topics.forEach((t) => add(`t${t.id}`, boost));
    for (const w of titleWords(`${e.title || ""} ${e.subtitle || ""}`)) {
      add(`w${w}`, boost * TITLE_WEIGHT);
    }
    tfs.set(e.id, tf);
  }

  const N = editions.length;
  const df = new Map();
  for (const tf of tfs.values()) {
    for (const k of tf.keys()) df.set(k, (df.get(k) || 0) + 1);
  }

  const vectors = new Map();
  for (const [id, tf] of tfs) {
    const v = new Map();
    let norm = 0;
    for (const [k, count] of tf) {
      // Un término que solo tiene este dossier no puede coincidir con nadie:
      // solo achicaría su score al normalizar.
      if (df.get(k) < 2) continue;
      const w = (1 + Math.log(count)) * Math.log(N / df.get(k));
      if (w <= 0) continue;
      v.set(k, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const k of v.keys()) v.set(k, v.get(k) / norm);
    vectors.set(id, v);
  }

  const info = new Map(
    editions.map((e) => [
      e.id,
      {
        public: {
          id: e.id,
          number: e.number,
          title: e.title,
          titleES: e.titleES,
          subtitle: e.subtitle,
          subtitleES: e.subtitleES,
          isTranslatedES: e.isTranslatedES,
          coverImage: e.coverImage,
          datePublished: e.datePublished,
        },
        articleCount: e.articles.length,
      },
    ]),
  );
  return { at: Date.now(), editions: info, vectors, regionNames };
}

async function getIndex() {
  if (!cache || Date.now() - cache.at > CACHE_TTL_MS) {
    cache = await buildIndex();
  }
  return cache;
}

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
    let index = await getIndex();
    // Dossier recién creado (o recién con portada) que todavía no está en el
    // índice cacheado: reconstruir una vez.
    if (!index.vectors.has(editionId)) {
      const exists = await prisma.edition.findFirst({
        where: { id: editionId, coverImage: { not: null } },
        select: { id: true },
      });
      if (exists) {
        cache = null;
        index = await getIndex();
      }
    }

    const src = index.vectors.get(editionId);
    if (!src || !src.size) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const scored = [];
    for (const [id, v] of index.vectors) {
      if (id === editionId) continue;
      let score = 0;
      let bestRegion = null;
      for (const [k, w] of src) {
        const cw = v.get(k);
        if (!cw) continue;
        score += w * cw;
        if (k[0] === "r" && (!bestRegion || w * cw > bestRegion.w)) {
          bestRegion = { id: Number(k.slice(1)), w: w * cw };
        }
      }
      if (score <= 0) continue;
      const ed = index.editions.get(id);
      score *= Math.sqrt(
        Math.min(1, ed.articleCount / MIN_ARTICLES_FULL_SCORE),
      );
      scored.push({ ed, score, bestRegion });
    }

    scored.sort((x, y) => {
      if (y.score !== x.score) return y.score - x.score;
      const dx = x.ed.public.datePublished
        ? new Date(x.ed.public.datePublished).getTime()
        : 0;
      const dy = y.ed.public.datePublished
        ? new Date(y.ed.public.datePublished).getTime()
        : 0;
      return dy - dx;
    });

    const result = scored.slice(0, limit).map(({ ed, bestRegion }) => ({
      ...ed.public,
      regions: bestRegion
        ? [{ id: bestRegion.id, name: index.regionNames.get(bestRegion.id) }]
        : [],
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
