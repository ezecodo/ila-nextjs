// Formateo del cuerpo de un artículo para mostrarlo (títulos detectados,
// imágenes con pie, links a Dossiers con locale). ÚNICA copia: la usan las
// páginas públicas (ausgaben/[...legacyPath] y online/[...legacyPath]) y la
// Vorschau del publilab (ArticlePreview) — antes estaba copiada a mano en cada
// página y en la Vorschau, y las copias se habían separado (la Vorschau no
// mostraba lo mismo que la web).
//
// Código extraído TAL CUAL de las páginas (2026-10-01). Las dos páginas ya
// diferían entre sí y se respeta, para no cambiar cómo se ven artículos ya
// publicados — por eso hay dos variantes:
// - "ausgaben": pregunta corta → <h4>; normalizeContentForRender = sin cambios.
// - "online": pregunta corta → <h3>; acepta “ al inicio de un título; texto
//   plano sin etiquetas → <p> por línea.
// Unificarlas es una decisión editorial pendiente, no técnica.

function protectBlockquotes(html) {
  const stash = [];
  const protectedHtml = html.replace(
    /<blockquote>[\s\S]*?<\/blockquote>/gi,
    (m) => {
      stash.push(m);
      return `\u0000BQ${stash.length - 1}\u0000`;
    },
  );
  return {
    protectedHtml,
    restore: (h) =>
      h.replace(/\u0000BQ(\d+)\u0000/g, (_, i) => stash[Number(i)]),
  };
}

function autoFormatHeadings(html) {
  if (!html) return "";
  const { protectedHtml, restore } = protectBlockquotes(html);

  // Solo transformar si NO hay otros estilos además de <strong>
  const out = protectedHtml.replace(
    /<p>\s*<strong>([^<>{}]{3,80})<\/strong>\s*<\/p>/gi,
    (m, inner) => {
      // Heurística: si es cortito y parece un subtítulo, h3
      const isHeadingLike =
        inner.length > 0 &&
        inner.length < 120 &&
        /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(inner) &&
        !/[.!?]$/.test(inner);

      return isHeadingLike ? `<h3>${inner}</h3>` : m;
    },
  );
  return restore(out);
}

function normalizeContentForRender(html) {
  if (!html) return "";
  return html;
}

function normalizeContentForRenderOnline(text) {
  if (!text) return "";

  // Si ya tiene etiquetas HTML, no hacemos nada
  if (/<\/?(p|h[1-6]|br|strong|em)(\s|>)/i.test(text)) {
    return text;
  }

  // Dividir por saltos de línea dobles o simples
  const paragraphs = text
    .split(/\n+/) // uno o más saltos
    .map((p) => p.trim())
    .filter(Boolean);

  // Reconstruir en <p>
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

function autoDetectHeadings(html) {
  if (!html) return "";
  const { protectedHtml, restore } = protectBlockquotes(html);
  const out = protectedHtml.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
    const text = inner
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const isShort = text.length > 0 && text.length <= 140;
    const startsWithUpper = /^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text);
    const endsAsHeading = /[?!:]\s*$/.test(text) || !/[.!?]$/.test(text);
    const looksLikeQuestion = /\?\s*$/.test(text);
    const fewSentences = (text.match(/[.!?]/g) || []).length <= 1;
    if (looksLikeQuestion && isShort) return `<h4>${text}</h4>`;
    if (isShort && startsWithUpper && endsAsHeading && fewSentences) return `<h3>${text}</h3>`;
    return m;
  });
  return restore(out);
}

function autoDetectHeadingsOnline(html) {
  if (!html) return "";

  // Si ya hay h3, no tocamos nada
  /* if (/<h3\b/i.test(html)) return html; */

  const { protectedHtml, restore } = protectBlockquotes(html);
  const out = protectedHtml.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
    // quitar <br> y normalizar espacios
    const text = inner
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Heurísticas
    const isShort = text.length > 0 && text.length <= 140; // párrafo corto
    const startsWithUpper = /^[“"'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text); // mayúscula (con o sin comillas)
    const endsAsHeading = /[?!:]\s*$/.test(text) || !/[.!?]$/.test(text); // termina en ?, !, : o sin punto final
    const looksLikeQuestion = /\?\s*$/.test(text); // pregunta
    const fewSentences = (text.match(/[.!?]/g) || []).length <= 1; // no parece un párrafo largo

    // Regla: preguntas cortas -> h2
    if (looksLikeQuestion && isShort) {
      return `<h3>${text}</h3>`;
    }

    // Regla general para títulos cortos
    if (isShort && startsWithUpper && endsAsHeading && fewSentences) {
      return `<h3>${text}</h3>`;
    }

    return m;
  });
  return restore(out);
}

function wrapInlineImagesWithCaption(html) {
  if (!html) return "";
  return html.replace(/<img([^>]+)>/gi, (match, attrs) => {
    const altMatch   = attrs.match(/alt="([^"]*)"/);
    const titleMatch = attrs.match(/title="([^"]*)"/);
    const alignMatch = attrs.match(/data-align="([^"]*)"/);
    const caption    = (altMatch?.[1]   || "").trim();
    const credit     = (titleMatch?.[1] || "").trim();
    const align      = (alignMatch?.[1] || "").trim();
    const floatClass =
      align === "left"
        ? " inline-image-left"
        : align === "right"
          ? " inline-image-right"
          : "";
    if (!caption && !credit && !floatClass) return match;
    // En figura flotada el ancho va en el <figure> (la imagen interna = 100%).
    const w = attrs.match(/width:\s*(\d+)%/)?.[1];
    const figStyle = floatClass && w ? ` style="width:${w}%"` : "";
    const figcaptionContent = caption && credit
      ? `${caption}<span class="image-credit"> · ${credit}</span>`
      : caption || credit;
    const figcap = caption || credit
      ? `<figcaption>${figcaptionContent}</figcaption>`
      : "";
    return `<figure class="inline-image-figure${floatClass}"${figStyle}>${match}${figcap}</figure>`;
  });
}

function rewriteEditionLinksWithLocale(html, locale) {
  if (!html) return "";

  // 1) Links con marcador explícito: <a data-ila="edition" data-id="123" href="/editions/123">
  html = html.replace(
    /<a([^>]*\sdata-ila="edition"[^>]*)\s+href="\/?editions\/(\d+)"([^>]*)>/gi,
    (m, pre, id, post) => `<a${pre} href="/${locale}/editions/${id}"${post}>`,
  );

  // 2) Cualquier href relativo tipo /editions/123
  html = html.replace(
    /href="\/editions\/(\d+)"/gi,
    (_, id) => `href="/${locale}/editions/${id}"`,
  );

  // 3) Reparar los casos rotos tipo https://de/editions/123 o https://es/editions/123
  html = html.replace(
    /href="https?:\/\/(de|es)\/editions\/(\d+)"/gi,
    (_, __, id) => `href="/${locale}/editions/${id}"`,
  );

  // 4) Reparar cualquier host absoluto (localhost, vercel, hetzner, etc.)
  html = html.replace(
    /href="https?:\/\/[^"]*\/editions\/(\d+)"/gi,
    (_, id) => `href="/${locale}/editions/${id}"`,
  );

  return html;
}

// Funciones de formateo según dónde vive el artículo.
export function articleTransforms(variant = "ausgaben") {
  const online = variant === "online";
  return {
    protectBlockquotes,
    autoFormatHeadings,
    normalizeContentForRender: online
      ? normalizeContentForRenderOnline
      : normalizeContentForRender,
    autoDetectHeadings: online ? autoDetectHeadingsOnline : autoDetectHeadings,
    wrapInlineImagesWithCaption,
    rewriteEditionLinksWithLocale,
  };
}

// Pipeline completo del cuerpo, en el mismo orden que las páginas.
export function renderArticleBody(html, locale, variant = "ausgaben") {
  const t = articleTransforms(variant);
  return t.wrapInlineImagesWithCaption(
    t.rewriteEditionLinksWithLocale(
      t.autoDetectHeadings(t.autoFormatHeadings(t.normalizeContentForRender(html))),
      locale,
    ),
  );
}
