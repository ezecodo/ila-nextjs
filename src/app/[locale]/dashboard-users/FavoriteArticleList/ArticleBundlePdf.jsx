"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Fonts ─────────────────────────────────────────────────────────────────────
// Times-Roman is built-in to @react-pdf/renderer — no registration needed.
// Helvetica is also built-in.

// ── Pre-process: replicate article-page transforms on raw HTML ────────────────
// These mirror the functions in ausgaben/[...legacyPath]/page.js so the PDF
// sees the same heading structure as the public article page.
function applyHeadingTransforms(html) {
  if (!html) return "";

  // 1. autoFormatHeadings: <p><strong>Título</strong></p> → <h3>
  //    Only matches plain <p> (no attributes) to avoid touching interview questions
  //    which have <p style="font-size:…"><strong>…</strong></p>
  html = html.replace(
    /<p>\s*<strong>([^<>{}]{3,80})<\/strong>\s*<\/p>/gi,
    (m, inner) => {
      const isHeadingLike =
        inner.length > 0 &&
        inner.length < 120 &&
        /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(inner) &&
        !/[.!?]$/.test(inner);
      return isHeadingLike ? `<h3>${inner}</h3>` : m;
    }
  );

  // 2. autoDetectHeadings: short plain <p> → <h3>/<h4>
  html = html.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
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
    if (isShort && startsWithUpper && endsAsHeading && fewSentences)
      return `<h3>${text}</h3>`;
    return m;
  });

  return html;
}

// Mirrors wrapInlineImagesWithCaption in the article page:
// alt = visible caption/credit, title = secondary. Join with " · " when both present.
function buildImgCaption(imgNode) {
  const alt = (imgNode.getAttribute("alt") || "").trim();
  const title = (imgNode.getAttribute("title") || "").trim();
  if (alt && title) return `${alt} · ${title}`;
  return alt || title || "";
}

// ── HTML → structured blocks ──────────────────────────────────────────────────
// isInterview: when true, <p style="…"><strong>Q</strong></p> → red question
export function htmlToBlocks(html, isInterview = false) {
  if (!html || typeof document === "undefined") return [];

  // Apply the same transforms the article page does before rendering
  const processed = applyHeadingTransforms(html);

  const parser = new DOMParser();
  const doc = parser.parseFromString(processed, "text/html");
  const blocks = [];

  function walk(node) {
    if (node.nodeType === 3) {
      const t = node.textContent.trim();
      if (t) blocks.push({ type: "paragraph", text: t });
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();

    switch (tag) {
      // ── Headings (after transforms these are real <hN> tags) ──
      case "h2":
        if (text) blocks.push({ type: "h2", text });
        break;
      case "h3":
        if (text) blocks.push({ type: "h3", text });
        break;
      case "h4":
        if (text) blocks.push({ type: "h4", text });
        break;

      // ── Quote ──
      case "blockquote":
        if (text) blocks.push({ type: "quote", text });
        break;

      // ── Lists ──
      case "ul":
      case "ol":
        for (const child of node.childNodes) {
          if (child.nodeType === 1 && child.tagName.toLowerCase() === "li") {
            const t = child.textContent.trim();
            if (t) blocks.push({ type: "listitem", text: "• " + t });
          }
        }
        break;
      case "li":
        if (text) blocks.push({ type: "listitem", text: "• " + text });
        break;

      // ── Standalone image ──
      case "img": {
        const src = node.getAttribute("src");
        if (src) {
          blocks.push({
            type: "image",
            src,
            caption: buildImgCaption(node),
          });
        }
        break;
      }

      // ── Figure with optional caption ──
      case "figure": {
        const img = node.querySelector("img");
        if (img) {
          const src = img.getAttribute("src");
          if (src) {
            blocks.push({
              type: "image",
              src,
              caption:
                node.querySelector("figcaption")?.textContent.trim() ||
                buildImgCaption(img),
            });
          }
        }
        break;
      }

      // ── Paragraph ──
      case "p": {
        // Check for image-only paragraph BEFORE the empty-text guard,
        // because <p><img …></p> has textContent === "" and would be skipped.
        const imgEl = node.querySelector("img");
        if (imgEl && !text) {
          const src = imgEl.getAttribute("src");
          if (src) {
            blocks.push({
              type: "image",
              src,
              caption: buildImgCaption(imgEl),
            });
          }
          break;
        }

        if (!text) break;

        // Interview question detection:
        // qaToHtml emits <p style="font-size:…"><strong>Q</strong></p>
        // After autoFormatHeadings (which only touches plain <p>), these survive intact.
        const hasStyleAttr = node.hasAttribute("style");
        const strong = node.querySelector("strong");
        const strongCoversAll = strong && strong.textContent.trim() === text;

        if (isInterview && strongCoversAll && hasStyleAttr) {
          // Proper interview question with font-size style
          blocks.push({ type: "question", text });
          break;
        }

        // Normal paragraph — collect inline segments (plain / bold / italic)
        const segments = [];
        function collectSegments(n) {
          if (n.nodeType === 3) {
            const t = n.textContent;
            if (t) segments.push({ text: t, bold: false, italic: false });
            return;
          }
          if (n.nodeType !== 1) return;
          const t2 = n.tagName.toLowerCase();
          if (t2 === "strong" || t2 === "b") {
            segments.push({ text: n.textContent, bold: true, italic: false });
          } else if (t2 === "em" || t2 === "i") {
            segments.push({ text: n.textContent, bold: false, italic: true });
          } else if (t2 === "img") {
            // already handled above
          } else {
            for (const child of n.childNodes) collectSegments(child);
          }
        }
        for (const child of node.childNodes) collectSegments(child);

        if (segments.some((s) => s.bold || s.italic)) {
          blocks.push({ type: "rich", segments });
        } else {
          blocks.push({ type: "paragraph", text });
        }
        break;
      }

      case "script":
      case "style":
      case "br":
        break;

      default:
        for (const child of node.childNodes) walk(child);
    }
  }

  for (const child of doc.body.childNodes) walk(child);
  return blocks;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const ILA_RED = "#BD0E0D";
const GRAY_900 = "#111827";
const GRAY_700 = "#374151";
const GRAY_500 = "#6B7280";
const GRAY_300 = "#D1D5DB";

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // ── Pages
  coverPage: {
    padding: "56 60",
    backgroundColor: "#fff",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  articlePage: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    backgroundColor: "#fff",
  },

  // ── Cover — top section
  coverAccent: {
    width: 5,
    height: 56,
    backgroundColor: ILA_RED,
    marginBottom: 20,
  },
  coverLogo: {
    fontSize: 72,
    fontFamily: "Helvetica-Bold",
    color: ILA_RED,
    letterSpacing: -3,
    lineHeight: 1,
  },
  coverHeading: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
    marginTop: 10,
  },
  coverDate: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: GRAY_500,
    marginTop: 4,
    marginBottom: 36,
  },

  // ── Cover — ToC
  tocLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GRAY_500,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 5,
    borderBottom: `1 solid ${GRAY_300}`,
  },
  tocRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 11,
  },
  tocIndex: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ILA_RED,
    width: 24,
    paddingTop: 1,
  },
  tocTextCol: {
    flexDirection: "column",
    flex: 1,
  },
  tocTitle: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: GRAY_700,
    lineHeight: 1.4,
  },
  tocAuthor: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: GRAY_500,
    marginTop: 3,
  },

  // ── Cover — footer
  coverFooter: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: GRAY_300,
  },

  // ── Article header
  articleTopBar: {
    width: "100%",
    height: 4,
    backgroundColor: ILA_RED,
    marginBottom: 24,
  },
  articleMeta: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: GRAY_500,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  articleTitle: {
    fontSize: 26,
    fontFamily: "Times-Bold",
    color: GRAY_900,
    marginBottom: 8,
    lineHeight: 1.25,
  },
  articleSubtitle: {
    fontSize: 14,
    fontFamily: "Times-Italic",
    color: GRAY_700,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  articleDivider: {
    borderBottom: `1 solid ${GRAY_300}`,
    marginBottom: 20,
  },
  articleCoverImage: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    marginBottom: 20,
    borderRadius: 3,
  },

  // ── Content blocks
  paragraph: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: GRAY_900,
    lineHeight: 1.75,
    marginBottom: 10,
  },
  h2: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    color: GRAY_900,
    marginTop: 18,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    color: GRAY_900,
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GRAY_700,
    marginTop: 12,
    marginBottom: 5,
  },
  question: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ILA_RED,
    marginTop: 14,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  quoteBar: {
    width: 3,
    backgroundColor: ILA_RED,
    marginRight: 10,
    borderRadius: 2,
  },
  quoteText: {
    fontSize: 11,
    fontFamily: "Times-Italic",
    color: GRAY_700,
    lineHeight: 1.7,
    flex: 1,
  },
  quoteWrap: {
    flexDirection: "row",
    marginVertical: 10,
    paddingVertical: 4,
  },
  listitem: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: GRAY_900,
    marginBottom: 4,
    paddingLeft: 6,
    lineHeight: 1.6,
  },
  // Inline image
  imageWrap: {
    marginVertical: 12,
    alignItems: "center",
  },
  inlineImage: {
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    borderRadius: 3,
  },
  imageCaption: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: GRAY_500,
    fontStyle: "italic",
    marginTop: 4,
    textAlign: "center",
  },
  // Rich paragraph (mixed bold/italic)
  richWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  richNormal: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: GRAY_900,
    lineHeight: 1.75,
  },
  richBold: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: GRAY_900,
    lineHeight: 1.75,
  },
  richItalic: {
    fontSize: 11,
    fontFamily: "Times-Italic",
    color: GRAY_900,
    lineHeight: 1.75,
  },

  // ── Page number
  pageNum: {
    position: "absolute",
    fontSize: 8,
    fontFamily: "Helvetica",
    bottom: 28,
    right: 56,
    color: GRAY_300,
  },
});

// ── Block renderer ────────────────────────────────────────────────────────────
function Block({ block }) {
  switch (block.type) {
    case "h2":
      return <Text style={S.h2}>{block.text}</Text>;
    case "h3":
      return <Text style={S.h3}>{block.text}</Text>;
    case "h4":
      return <Text style={S.h4}>{block.text}</Text>;
    case "question":
      return <Text style={S.question}>{block.text}</Text>;
    case "quote":
      return (
        <View style={S.quoteWrap}>
          <View style={S.quoteBar} />
          <Text style={S.quoteText}>{block.text}</Text>
        </View>
      );
    case "listitem":
      return <Text style={S.listitem}>{block.text}</Text>;
    case "image":
      return (
        <View style={S.imageWrap}>
          <Image src={block.src} style={S.inlineImage} />
          {block.caption ? (
            <Text style={S.imageCaption}>{block.caption}</Text>
          ) : null}
        </View>
      );
    case "rich":
      return (
        <View style={S.richWrap}>
          {block.segments.map((seg, i) => (
            <Text
              key={i}
              style={
                seg.bold
                  ? S.richBold
                  : seg.italic
                  ? S.richItalic
                  : S.richNormal
              }
            >
              {seg.text}
            </Text>
          ))}
        </View>
      );
    case "paragraph":
    default:
      return <Text style={S.paragraph}>{block.text}</Text>;
  }
}

// ── i18n strings embedded in PDF (can't use next-intl inside react-pdf) ──────
const PDF_STRINGS = {
  de: { coverTitle: "Meine Artikel", tocLabel: "INHALT", online: "Online" },
  es: { coverTitle: "Mis Artículos", tocLabel: "CONTENIDO", online: "Online" },
};

// ── Cover page ────────────────────────────────────────────────────────────────
function CoverPage({ articles, locale, customTitle }) {
  const str = PDF_STRINGS[locale] ?? PDF_STRINGS.de;
  const heading = (customTitle && customTitle.trim()) || str.coverTitle;
  const dateLocale = locale === "es" ? "es-ES" : "de-DE";
  const today = new Date().toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Page size="A4" style={S.coverPage}>
      <View>
        <View style={S.coverAccent} />
        <Text style={S.coverLogo}>ila</Text>
        <Text style={S.coverHeading}>{heading}</Text>
        <Text style={S.coverDate}>{today}</Text>

        <Text style={S.tocLabel}>{str.tocLabel}</Text>
        {articles.map((a, i) => {
          const authors = a.authors?.map((au) => au.name).join(", ") || "";
          return (
            <View key={a.id} style={S.tocRow}>
              <Text style={S.tocIndex}>{i + 1}</Text>
              <View style={S.tocTextCol}>
                <Text style={S.tocTitle}>{a.title}</Text>
                {authors ? (
                  <Text style={S.tocAuthor}>{authors}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={S.coverFooter}>
        www.ila-web.de · Informationsstelle Lateinamerika e.V.
      </Text>
    </Page>
  );
}

// ── Article page ──────────────────────────────────────────────────────────────
function ArticlePage({ article, locale }) {
  const str = PDF_STRINGS[locale] ?? PDF_STRINGS.de;
  const isInterview =
    article.beitragstyp?.name?.toLowerCase() === "interview" ||
    article.isInterview === true;
  const blocks = htmlToBlocks(article.content || "", isInterview);

  const authors = article.authors?.map((a) => a.name).join(", ") || "";
  const edition = article.edition
    ? `ila ${article.edition.number}`
    : str.online;
  const dateLocale = locale === "es" ? "es-ES" : "de-DE";
  const date = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString(dateLocale, {
        month: "long",
        year: "numeric",
      })
    : "";
  const meta = [authors, edition, date].filter(Boolean).join(" · ");

  const coverImg = article.images?.[0] || null;
  const coverImage = coverImg?.url || null;
  const coverAlt = (coverImg?.displayAlt || "").trim();
  const coverTitle = (coverImg?.displayTitle || "").trim();
  const coverCaption =
    coverAlt && coverTitle
      ? `${coverAlt} · ${coverTitle}`
      : coverAlt || coverTitle || "";

  return (
    <Page size="A4" style={S.articlePage} wrap>
      <View style={S.articleTopBar} fixed />

      {meta ? <Text style={S.articleMeta}>{meta}</Text> : null}
      <Text style={S.articleTitle}>{article.title}</Text>
      {article.subtitle ? (
        <Text style={S.articleSubtitle}>{article.subtitle}</Text>
      ) : null}

      <View style={S.articleDivider} />

      {coverImage && (
        <View style={S.imageWrap}>
          <Image src={coverImage} style={S.articleCoverImage} />
          {coverCaption ? (
            <Text style={S.imageCaption}>{coverCaption}</Text>
          ) : null}
        </View>
      )}

      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}

      <Text
        style={S.pageNum}
        render={({ pageNumber }) => String(pageNumber)}
        fixed
      />
    </Page>
  );
}

// ── Document ──────────────────────────────────────────────────────────────────
export function ArticleBundleDocument({ articles, locale = "de", customTitle }) {
  const defaultTitle = PDF_STRINGS[locale]?.coverTitle ?? "Meine Artikel";
  const docTitle =
    (customTitle && customTitle.trim()) || defaultTitle;
  return (
    <Document
      title={`ila – ${docTitle}`}
      author="ila – Informationsstelle Lateinamerika"
    >
      <CoverPage articles={articles} locale={locale} customTitle={customTitle} />
      {articles.map((article) => (
        <ArticlePage key={article.id} article={article} locale={locale} />
      ))}
    </Document>
  );
}
