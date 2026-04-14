/**
 * Shared HTML transformation functions used by the article page renderer
 * and the InterviewEditor preview.
 */

export function autoFormatHeadings(html) {
  if (!html) return "";
  return html.replace(
    /<p>\s*<strong>([^<>{}]{3,80})<\/strong>\s*<\/p>/gi,
    (m, inner) => {
      const isHeadingLike =
        inner.length > 0 &&
        inner.length < 120 &&
        /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(inner) &&
        !/[.!?]$/.test(inner);
      return isHeadingLike ? `<h3>${inner}</h3>` : m;
    },
  );
}

export function autoDetectHeadings(html) {
  if (!html) return "";
  const hasH4 = /<h4\b/i.test(html);
  return html.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
    const text = inner
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const isShort = text.length > 0 && text.length <= 140;
    const startsWithUpper = /^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text);
    const endsAsHeading = /[?!:]\s*$/.test(text) || !/[.!?]$/.test(text);
    const looksLikeQuestion = /\?\s*$/.test(text);
    const fewSentences = (text.match(/[.!?]/g) || []).length <= 1;
    if (!hasH4 && looksLikeQuestion && isShort) return `<h4>${text}</h4>`;
    if (isShort && startsWithUpper && endsAsHeading && fewSentences) return `<h3>${text}</h3>`;
    return m;
  });
}

export function wrapInlineImagesWithCaption(html) {
  if (!html) return "";
  return html.replace(/<img([^>]+)>/gi, (match, attrs) => {
    const altMatch   = attrs.match(/alt="([^"]*)"/);
    const titleMatch = attrs.match(/title="([^"]*)"/);
    const caption    = (altMatch?.[1]  || "").trim();
    const credit     = (titleMatch?.[1] || "").trim();
    if (!caption && !credit) return match;
    const figcaptionContent = caption && credit
      ? `${caption}<span class="image-credit"> · ${credit}</span>`
      : caption || credit;
    return `<figure class="inline-image-figure">${match}<figcaption>${figcaptionContent}</figcaption></figure>`;
  });
}

export function normalizeContentForRender(html) {
  if (!html) return "";
  return html;
}

/** Apply all transforms in the same order as the article page */
export function transformArticleContent(html) {
  return wrapInlineImagesWithCaption(
    autoDetectHeadings(
      autoFormatHeadings(
        normalizeContentForRender(html)
      )
    )
  );
}
