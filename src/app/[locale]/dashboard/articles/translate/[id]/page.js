"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Copy } from "lucide-react";
// Render transforms — same logic as the public article page
// wrapImages: true for read-only display, false for editable content (avoid double-wrapping on save)
function normalizeForDisplay(html, { wrapImages = true } = {}) {
  if (!html) return "";
  // 1. Strip inline font-family / color / background
  html = html.replace(/style="([^"]*)"/gi, (_, styles) => {
    const cleaned = styles
      .replace(/font-family\s*:[^;]+;?/gi, "")
      .replace(/\bcolor\s*:[^;]+;?/gi, "")
      .replace(/background(-color)?\s*:[^;]+;?/gi, "")
      .trim()
      .replace(/^;+|;+$/g, "");
    return cleaned ? `style="${cleaned}"` : "";
  });
  // 2. Remove empty paragraphs
  html = html.replace(/<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
  // 3. <p><strong>Title</strong></p> → <h3>
  html = html.replace(
    /<p>\s*<strong>([^<>]{3,120})<\/strong>\s*<\/p>/gi,
    (m, inner) => {
      const isHeadingLike =
        inner.length > 0 &&
        inner.length < 120 &&
        /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(inner) &&
        !/[.!?]$/.test(inner);
      return isHeadingLike ? `<h3>${inner}</h3>` : m;
    }
  );
  // 4. Short plain paragraphs → h3/h4
  html = html.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
    const text = inner.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
    const isShort = text.length > 0 && text.length <= 140;
    const startsWithUpper = /^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text);
    const looksLikeQuestion = /\?\s*$/.test(text);
    // A real sentence ending has a lowercase ASCII letter before the punctuation.
    // Abbreviations like "EE. UU.", "Dr.", "USA." have uppercase/digits → not a sentence end.
    const endsWithSentence = /[a-z][.!?]\s*$/.test(text);
    const endsAsHeading = looksLikeQuestion || /[!:]\s*$/.test(text) || !endsWithSentence;
    const fewSentences = (text.match(/[a-z][.!?]/g) || []).length <= 1;
    if (looksLikeQuestion && isShort) return `<h4>${text}</h4>`;
    if (isShort && startsWithUpper && endsAsHeading && fewSentences) return `<h3>${text}</h3>`;
    return m;
  });
  // 5. <img> → <figure> with figcaption (alt + title) — only for read-only display
  if (!wrapImages) return html;
  html = html.replace(/<img([^>]+)>/gi, (match, attrs) => {
    const altMatch   = attrs.match(/alt="([^"]*)"/);
    const titleMatch = attrs.match(/title="([^"]*)"/);
    const alignMatch = attrs.match(/data-align="([^"]*)"/);
    const caption = (altMatch?.[1]  || "").trim();
    const credit  = (titleMatch?.[1] || "").trim();
    const align   = (alignMatch?.[1] || "").trim();
    const floatClass =
      align === "left"
        ? " inline-image-left"
        : align === "right"
          ? " inline-image-right"
          : "";
    if (!caption && !credit && !floatClass) return match;
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
  return html;
}

// Replace img alt/title with ES translations if available (matched by src URL)
function applyESTranslationsToImages(html, inlineImages, imageTranslations) {
  if (!html || !inlineImages.length) return html;
  return html.replace(/<img([^>]+)>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src="([^"]*)"/);
    if (!srcMatch) return match;
    const src = srcMatch[1];
    const img = inlineImages.find((i) => i.url === src);
    if (!img) return match;
    const trans = imageTranslations[img.id];
    if (!trans) return match;
    let newAttrs = attrs;
    if (trans.altES) newAttrs = newAttrs.replace(/alt="[^"]*"/, `alt="${trans.altES}"`);
    if (trans.titleES) newAttrs = newAttrs.replace(/title="[^"]*"/, `title="${trans.titleES}"`);
    return `<img${newAttrs}>`;
  });
}

// Strip <figure> wrappers added for display — keeps only the <img> tag
// Prevents double-wrapping when content is saved and re-rendered by the article page
function stripFigureWrappers(html) {
  return html.replace(
    /<figure[^>]*>\s*(<img[^>]+>)\s*(?:<figcaption>[\s\S]*?<\/figcaption>)?\s*<\/figure>/gi,
    "$1"
  );
}

// Normalize Chrome contentEditable output: <div> → <p> so the Publisher can parse it correctly
function normalizeDivsToParagraphs(html) {
  return html
    .replace(/<div>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>");
}

function cleanContentHtml(html) {
  if (!html || typeof window === "undefined") return html || "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // Unwrap <font> tags: split on <br><br> and replace with proper <p> tags
  tmp.querySelectorAll("font").forEach((font) => {
    const fragment = document.createDocumentFragment();
    const parts = font.innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/gi);
    parts.forEach((part) => {
      const clean = part.replace(/^(<br\s*\/?>|\s)+|(<br\s*\/?>|\s)+$/gi, "").trim();
      if (!clean) return;
      const p = document.createElement("p");
      p.innerHTML = clean;
      fragment.appendChild(p);
    });
    font.parentNode.replaceChild(fragment, font);
  });

  // Remove style/class from text elements; keep href/class on <a> and attrs on media
  const MEDIA = new Set(["IMG", "FIGURE", "VIDEO", "IFRAME"]);
  tmp.querySelectorAll("*").forEach((el) => {
    if (el.tagName === "A") {
      // Preserve href and ila-dossier class — strip only inline style
      el.removeAttribute("style");
      if (!el.classList.contains("ila-dossier")) el.removeAttribute("class");
      // Ensure external links open in new tab
      if (el.getAttribute("href") && !el.getAttribute("href").startsWith("/")) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    } else if (!MEDIA.has(el.tagName)) {
      el.removeAttribute("style");
      el.removeAttribute("class");
    }
  });
  return tmp.innerHTML;
}

function stripHtml(html) {
  if (!html) return "";
  // Sustituir <br> por salto de línea
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  // Sustituir </p> por doble salto de línea
  text = text.replace(/<\/p>/gi, "\n\n");
  // Eliminar todas las demás etiquetas
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.body.textContent || "";
}

// Convierte texto plano (con \n\n y URLs sueltas) a HTML con <p> y <a>.
// - Si no tiene <p>/<br>/<div>, envuelve párrafos con <p>.
// - Si no tiene <a>, linkea URLs sueltas (preservando el HTML existente).
// Idempotente: si ya tiene <p> Y <a>, devuelve igual.
function plainToHtmlAdditionalInfo(input) {
  if (!input) return "";
  let out = input;

  const hasStructure = /<(p|br|div)\b/i.test(out);
  if (!hasStructure) {
    out = out
      .split(/\n{2,}/)
      .map((p) => p.replace(/\n/g, "<br>"))
      .filter((p) => p.replace(/<br>/g, "").trim() !== "")
      .map((p) => `<p>${p}</p>`)
      .join("");
  }

  if (!/<a\b[^>]*>/i.test(out)) {
    out = out.replace(
      /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );
  }

  return out;
}

// ── Smart paste formatting (same logic as Publisher/Publilab) ─────────────

function escHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Short line that looks like a section heading (not a full sentence)
function isSubtitleLine(text) {
  if (!text || text.length > 140) return false;
  if (!/^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text)) return false;
  if (/:\s*$/.test(text)) return true;
  // Real sentence endings need a lowercase ASCII letter before the punctuation.
  // Abbreviations like "EE. UU.", "Dr." have uppercase before → not a sentence end.
  const endsWithSentence = /[a-z][.!?]\s*$/.test(text);
  const fewSentences = (text.match(/[a-z][.!?]/g) || []).length <= 1;
  return !endsWithSentence && fewSentences;
}

// Strip formatting from a DOM element's inner content while preserving <a> tags.
// Returns cleaned innerHTML safe to embed directly.
function cleanElInnerHtml(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll("*").forEach((node) => {
    node.removeAttribute("style");
    if (node.tagName === "A") {
      if (!node.classList.contains("ila-dossier")) node.removeAttribute("class");
      if (node.getAttribute("href") && !node.getAttribute("href").startsWith("/")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    } else {
      node.removeAttribute("class");
    }
  });
  return clone.innerHTML.trim();
}

// Convert pasted content (plain text + optional clipboard HTML) to structured HTML.
// Detects subtitles, questions, and body paragraphs — same heuristics as the Publisher.
// Preserves <a> links from the clipboard HTML.
function formatPastedHtml(plainText, clipboardHtml) {
  // Try to extract structure from clipboard HTML (e.g. Google Docs, Google Translate)
  if (clipboardHtml && typeof window !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(clipboardHtml, "text/html");
    // Unwrap <font> tags
    doc.body.querySelectorAll("font").forEach((font) => {
      const span = doc.createElement("span");
      span.innerHTML = font.innerHTML;
      font.parentNode.replaceChild(span, font);
    });
    const elements = Array.from(
      doc.body.querySelectorAll("p, h1, h2, h3, h4, div")
    );
    if (elements.length > 1) {
      let html = "";
      for (const el of elements) {
        const text = el.textContent.trim();
        if (!text) continue;
        const tag = el.tagName;
        const inner = cleanElInnerHtml(el); // preserves <a> tags
        if (tag === "H1" || tag === "H2" || tag === "H3") {
          html += `<h3>${inner}</h3>`;
        } else if (tag === "H4") {
          html += `<h4>${inner}</h4>`;
        } else {
          const strong = el.querySelector("strong, b");
          const onlyBold = strong && text === strong.textContent.trim() && !el.querySelector("a");
          if (onlyBold) {
            html += `<p><strong>${escHtml(text)}</strong></p>`;
          } else {
            html += `<p>${inner}</p>`;
          }
        }
      }
      if (html) return html;
    }
  }

  // ── Plain text path ───────────────────────────────────────────────────────
  // Split by line, treating subtitle-like lines as their own paragraph boundary
  // (no blank line required before/after them).
  const rawLines = plainText.split("\n");
  const paragraphs = []; // { text, isSubtitle?, isQuestion? }
  let currentLines = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (currentLines.length > 0) {
        paragraphs.push({ text: currentLines.join(" ").trim() });
        currentLines = [];
      }
    } else if (isSubtitleLine(trimmed)) {
      if (currentLines.length > 0) {
        paragraphs.push({ text: currentLines.join(" ").trim() });
        currentLines = [];
      }
      paragraphs.push({ text: trimmed, isSubtitle: true });
    } else {
      currentLines.push(trimmed);
    }
  }
  if (currentLines.length > 0)
    paragraphs.push({ text: currentLines.join(" ").trim() });

  return paragraphs
    .filter(({ text }) => text)
    .map(({ text, isSubtitle }) => {
      if (isSubtitle) return `<h3>${escHtml(text)}</h3>`;
      if (/\?\s*$/.test(text) && text.length <= 300)
        return `<p><strong>${escHtml(text)}</strong></p>`;
      return `<p>${escHtml(text)}</p>`;
    })
    .join("\n");
}


const TranslateArticlePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  // Tras guardar borrador volvemos a la pantalla de origen según el rol: el
  // admin al home del dashboard, el traductor a su lista de asignaciones.
  const afterDraftUrl =
    session?.user?.role === "admin"
      ? "/dashboard"
      : "/dashboard/translators/assignments";
  const [article, setArticle] = useState(null);
  const [translations, setTranslations] = useState({
    titleES: "",
    subtitleES: "",
    previewES: "",
    contentES: "",
    additionalInfoES: "",
  });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [modalSaveState, setModalSaveState] = useState("idle"); // idle | saving | saved | error
  const contentEditableRef = useRef(null);
  const contentEditableModalRef = useRef(null);
  const additionalInfoEditableRef = useRef(null);
  // Índice del párrafo del contenido donde quedó la traducción (persistido en BD).
  const savedScrollIndexRef = useRef(null);

  // Devuelve el índice del bloque (párrafo) que está arriba del todo en la
  // vista del editor de contenido del modal. Robusto a cambios de ancho/zoom.
  const getTopVisibleBlockIndex = () => {
    const editor = contentEditableModalRef.current;
    if (!editor) return null;
    const cTop = editor.getBoundingClientRect().top;
    const blocks = Array.from(editor.children);
    let idx = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].getBoundingClientRect().top - cTop <= 8) idx = i;
      else break;
    }
    return idx;
  };
  // El contenido ES cargado es el texto fuente real (p. ej. artículo escrito
  // originalmente en español, traducido al alemán para la revista impresa),
  // no una traducción DeepL — evita que la página pública le atribuya crédito
  // a DeepL cuando en realidad es el original.
  const [esIsOriginal, setEsIsOriginal] = useState(false);
  const [deepl, setDeepl] = useState(null); // { titleES, subtitleES, previewTextES, contentES, additionalInfoES }
  const [deeplLoading, setDeeplLoading] = useState(false);
  const [deeplError, setDeeplError] = useState("");
  const [images, setImages] = useState([]);
  const [inlineImages, setInlineImages] = useState([]);
  const [imageTranslations, setImageTranslations] = useState({});
  const savedRangeRef = useRef(null);
  const savedRangeModalRef = useRef(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierEditions, setDossierEditions] = useState([]);
  const [loadingDossierEditions, setLoadingDossierEditions] = useState(false);
  const [linkPopover, setLinkPopover] = useState(null); // { href, x, y, linkEl }
  const [linkEditMode, setLinkEditMode] = useState(false);
  const [linkEditUrl, setLinkEditUrl] = useState("");
  const [splitPercent, setSplitPercent] = useState(50);
  const splitContainerRef = useRef(null);
  const isDragging = useRef(false);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, block: "p" });

  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    const onMouseMove = (e) => {
      if (!isDragging.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(Math.max((x / rect.width) * 100, 20), 80);
      setSplitPercent(pct);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    const fetchArticle = async () => {
      const res = await fetch(`/api/articles/${id}`);
      const data = await res.json();
      setArticle(data);
      setEsIsOriginal(!!data.esIsOriginal);
      savedScrollIndexRef.current =
        typeof data.translationScrollES === "number"
          ? data.translationScrollES
          : null;
      setTranslations({
        titleES: data.titleES || "",
        subtitleES: data.subtitleES || "",
        previewES: data.previewTextES || "",
        contentES: data.contentES || "",
        additionalInfoES: data.additionalInfoES || "",
      });

      // 🖼️ Cargar imágenes de galería
      const imgTrans = {};
      if (data.images && data.images.length > 0) {
        setImages(data.images);
        data.images.forEach((img) => {
          imgTrans[img.id] = {
            altES: img.altES || "",
            titleES: img.titleES || "",
          };
        });
      }
      // 🖼️ Cargar imágenes inline
      if (data.inlineImages && data.inlineImages.length > 0) {
        setInlineImages(data.inlineImages);
        data.inlineImages.forEach((img) => {
          imgTrans[img.id] = {
            altES: img.altES || "",
            titleES: img.titleES || "",
          };
        });
      }
      if (Object.keys(imgTrans).length > 0) setImageTranslations(imgTrans);
    };
    fetchArticle();
  }, [id]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsReviewMode(params.get("mode") === "review");
  }, []);

  // Sincroniza contentES con el div editable solo cuando cambia externamente (DeepL / carga).
  // Si el usuario está editando activamente, no tocar el DOM (evita que el cursor salte al inicio).
  useEffect(() => {
    [contentEditableRef, contentEditableModalRef].forEach((ref) => {
      if (!ref.current) return;
      if (document.activeElement === ref.current) return; // usuario editando → no interferir
      const normalized = normalizeForDisplay(
        applyESTranslationsToImages(
          stripFigureWrappers(cleanContentHtml(translations.contentES || "")),
          inlineImages,
          imageTranslations
        ),
        { wrapImages: true }
      );
      if (ref.current.innerHTML !== normalized) {
        ref.current.innerHTML = normalized;
      }
    });
  }, [translations.contentES]);

  // Sincroniza additionalInfoES con su contentEditable solo cuando cambia externamente
  useEffect(() => {
    const ref = additionalInfoEditableRef;
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    const html = plainToHtmlAdditionalInfo(translations.additionalInfoES || "");
    if (ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [translations.additionalInfoES]);

  // Cerrar modal con Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setIsContentModalOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Al abrir el modal, sincronizar el contenido al div editable del modal
  useEffect(() => {
    if (!isContentModalOpen) return;
    setTimeout(() => {
      if (contentEditableModalRef.current) {
        contentEditableModalRef.current.innerHTML = normalizeForDisplay(
          applyESTranslationsToImages(
            stripFigureWrappers(cleanContentHtml(translations.contentES || "")),
            inlineImages,
            imageTranslations
          ),
          { wrapImages: true }
        );
        // Restaurar el scroll al párrafo donde se dejó la traducción
        // (índice persistido en la BD).
        requestAnimationFrame(() => {
          const editor = contentEditableModalRef.current;
          if (!editor) return;
          const saved = savedScrollIndexRef.current;
          if (Number.isInteger(saved) && saved > 0 && editor.children[saved]) {
            const target = editor.children[saved];
            editor.scrollTop +=
              target.getBoundingClientRect().top -
              editor.getBoundingClientRect().top;
          }
        });
      }
    }, 0);
  }, [isContentModalOpen]);

  const handleChange = (e) => {
    setTranslations({
      ...translations,
      [e.target.name]: e.target.value,
    });
  };

  // Enter → <br> (sin línea en blanco), Shift+Enter → párrafo nuevo (con espacio)
  // Usamos Range API en lugar de execCommand("insertLineBreak") para evitar que
  // Chrome herede formatos (negrita, etc.) al hacer Backspace sobre el <br>.
  const handleEditorKeyDown = (e) => {
    // Backspace al inicio de un <p> con un heading arriba: convertir el heading
    // en <p> ANTES de que el browser haga el merge, para que el texto no herede
    // el estilo h3/h4.
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.collapsed && range.startOffset === 0) {
          const editor = e.currentTarget;
          let block = range.startContainer;
          if (block.nodeType === 3) block = block.parentElement;
          while (block && block.parentElement !== editor) {
            block = block.parentElement;
          }
          const headingTags = ["H1", "H2", "H3", "H4", "H5", "H6"];
          if (
            block &&
            !headingTags.includes(block.tagName) &&
            block.previousElementSibling &&
            headingTags.includes(block.previousElementSibling.tagName)
          ) {
            const prev = block.previousElementSibling;
            const newP = document.createElement("p");
            newP.innerHTML = prev.innerHTML;
            prev.parentNode.replaceChild(newP, prev);
            // Restaurar el cursor al inicio del bloque actual y dejar que el
            // browser haga el merge nativo (ahora entre dos <p>).
            const newRange = document.createRange();
            newRange.setStart(block, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      range.deleteContents();

      // Insertar <br> limpio sin heredar estilos del entorno
      const br = document.createElement("br");
      range.insertNode(br);

      // Si el <br> queda al final del bloque, el cursor no sería visible en la
      // nueva línea — añadimos un segundo <br> para forzar el salto visible.
      const afterBr = br.nextSibling;
      if (!afterBr || (afterBr.nodeType === Node.TEXT_NODE && !afterBr.textContent.trim())) {
        br.parentNode.insertBefore(document.createElement("br"), br.nextSibling);
      }

      // Posicionar el cursor justo después del <br> insertado
      const newRange = document.createRange();
      newRange.setStartAfter(br);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      // Actualizar estado React (Range API no dispara evento input)
      const html = stripFigureWrappers(e.currentTarget.innerHTML);
      setTranslations((prev) => ({ ...prev, contentES: html }));
    }
  };

  // Detecta el formato activo en la posición del cursor y actualiza la toolbar
  const updateActiveFormats = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const bold = document.queryCommandState("bold");
    const italic = document.queryCommandState("italic");
    // Walk up the DOM to find the nearest block tag
    let node = sel.getRangeAt(0).startContainer;
    if (node.nodeType === 3) node = node.parentElement;
    let block = "p";
    while (node && node !== document.body) {
      const tag = node.tagName?.toLowerCase();
      if (["h1","h2","h3","h4","h5","h6","p","li","blockquote"].includes(tag)) {
        block = tag;
        break;
      }
      node = node.parentElement;
    }
    setActiveFormats({ bold, italic, block });
  };

  // ── Modal toolbar helpers ─────────────────────────────────────────────────
  const saveModalSelection = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount > 0)
      savedRangeModalRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreModalSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeModalRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeModalRef.current);
      return true;
    }
    return false;
  };

  // ── Link popover ──────────────────────────────────────────────────────────
  // Walk up the DOM from the cursor position to find a parent <a> element
  const getLinkAtCursor = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let el = sel.getRangeAt(0).startContainer;
    if (el.nodeType === 3) el = el.parentElement; // text node → element
    while (el && el !== contentEditableModalRef.current) {
      if (el.tagName === "A") return el;
      el = el.parentElement;
    }
    return null;
  };

  const handleModalMouseUp = (e) => {
    saveModalSelection();
    updateActiveFormats();
    // Small delay so the selection is settled
    setTimeout(() => {
      const linkEl = getLinkAtCursor();
      if (linkEl) {
        const rect = linkEl.getBoundingClientRect();
        const isDossier = linkEl.classList.contains("ila-dossier");
        const editionNumber = isDossier
          ? (linkEl.getAttribute("data-edition-number") || null)
          : null;
        setLinkPopover({
          href: linkEl.getAttribute("href") || "",
          linkText: linkEl.textContent.trim(),
          editionNumber,
          x: rect.left,
          y: rect.bottom + 6,
          linkEl,
          isDossier,
        });
        setLinkEditMode(false);
        setLinkEditUrl(linkEl.getAttribute("href") || "");
      } else {
        setLinkPopover(null);
      }
    }, 0);
  };

  const applyLinkEdit = () => {
    if (!linkPopover?.linkEl) return;
    const url = linkEditUrl.trim();
    if (!url) return;
    const full = url.startsWith("http") ? url : `https://${url}`;
    linkPopover.linkEl.setAttribute("href", full);
    if (!full.startsWith("/")) {
      linkPopover.linkEl.setAttribute("target", "_blank");
      linkPopover.linkEl.setAttribute("rel", "noopener noreferrer");
    }
    const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
    setTranslations((prev) => ({ ...prev, contentES: html }));
    setLinkPopover((prev) => ({ ...prev, href: full }));
    setLinkEditMode(false);
  };

  const removeLinkFromPopover = () => {
    if (!linkPopover?.linkEl) return;
    restoreModalSelection() || contentEditableModalRef.current?.focus();
    // Select the entire link element and unlink it
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNode(linkPopover.linkEl);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("unlink");
    const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
    setTranslations((prev) => ({ ...prev, contentES: html }));
    setLinkPopover(null);
  };

  // Execute a contenteditable command (bold, italic, etc.)
  const execModal = (cmd, arg = null) => {
    if (!restoreModalSelection()) contentEditableModalRef.current?.focus();
    document.execCommand(cmd, false, arg);
    const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
    setTranslations((prev) => ({ ...prev, contentES: html }));
    // Re-guardar selección (los nodos pueden haber cambiado tras el comando)
    saveModalSelection();
    // Update toolbar active state after applying format
    setTimeout(updateActiveFormats, 0);
  };

  // Wrap current block (paragraph/heading) in a different tag
  const setBlockTag = (tag) => {
    if (!restoreModalSelection()) contentEditableModalRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
    setTranslations((prev) => ({ ...prev, contentES: html }));
    // Re-guardar la selección post-formato: Chrome puede reemplazar nodos de
    // texto al cambiar el bloque y dejar la referencia previa inválida.
    saveModalSelection();
    // Update toolbar active state after applying format
    setTimeout(updateActiveFormats, 0);
  };

  const handleModalLink = (e) => {
    e.preventDefault();
    saveModalSelection();
    const url = prompt("URL:");
    if (!url) return;
    const full = url.startsWith("http") ? url : `https://${url}`;
    restoreModalSelection();
    document.execCommand("createLink", false, full);
    contentEditableModalRef.current?.querySelectorAll("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
    const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
    setTranslations((prev) => ({ ...prev, contentES: html }));
  };

  const handleDossierClick = async (e) => {
    e.preventDefault();
    saveModalSelection();
    if (dossierEditions.length === 0) {
      setLoadingDossierEditions(true);
      try {
        const res = await fetch("/api/editions");
        const data = await res.json();
        setDossierEditions(data.sort((a, b) => b.number - a.number));
      } catch {}
      setLoadingDossierEditions(false);
    }
    setShowDossierModal(true);
  };

  const handleDossierSelect = (edition) => {
    setShowDossierModal(false);
    const href = `/editions/${edition.id}`;

    // Editing an existing dossier link from the popover
    if (linkPopover?.isDossier && linkPopover.linkEl) {
      linkPopover.linkEl.setAttribute("href", href);
      linkPopover.linkEl.setAttribute("data-edition-number", edition.number);
      // Keep existing link text — only the destination changes
      const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
      setTranslations((prev) => ({ ...prev, contentES: html }));
      setLinkPopover(null);
      return;
    }

    // Inserting a new dossier link
    restoreModalSelection() || contentEditableModalRef.current?.focus();
    const sel = window.getSelection();
    const hasSelection = sel?.rangeCount > 0 && !sel.isCollapsed;
    if (hasSelection) {
      document.execCommand("createLink", false, href);
      contentEditableModalRef.current
        ?.querySelectorAll(`a[href="${href}"]`)
        .forEach((a) => {
          a.classList.add("ila-dossier");
          a.setAttribute("data-edition-number", edition.number);
        });
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${href}" class="ila-dossier" data-edition-number="${edition.number}">ila ${edition.number}</a>`
      );
    }
    const html = stripFigureWrappers(contentEditableModalRef.current.innerHTML);
    setTranslations((prev) => ({ ...prev, contentES: html }));
  };

  // Reliable paste insertion using Range API
  const insertFormattedHtml = (target, html) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      const lastNode = fragment.lastChild;
      range.insertNode(fragment);
      if (lastNode) {
        const endRange = document.createRange();
        endRange.setStartAfter(lastNode);
        endRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(endRange);
      }
    } else {
      target.innerHTML = html;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
  };

  if (!article) {
    return <div className="p-6 text-gray-600">⏳ Cargando artículo...</div>;
  }
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("📋 Copiado al portapapeles:", text);
    });
  };
  // Llama a tu endpoint backend y cachea el resultado en estado
  const fetchDeepl = async () => {
    if (deepl) return deepl; // ya cargado
    try {
      setDeeplLoading(true);
      setDeeplError("");
      const res = await fetch("/api/translate/deepl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json(); // { translations: {...}, imageTranslations: {...} }
      setDeepl(data);
      return data;
    } catch (e) {
      setDeeplError(e.message || "DeepL error");
      alert(`❌ DeepL: ${e.message || "Error desconocido"}`);
      return null;
    } finally {
      setDeeplLoading(false);
    }
  };

  // Returns true only if the field has real visible text (not just empty HTML tags)
  const hasRealContent = (value) => {
    if (!value) return false;
    return value.replace(/<[^>]*>/g, "").trim().length > 0;
  };

  // Rellena TODO el formulario con lo de DeepL (solo vacíos, no pisa lo escrito)
  const fillAllFromDeepl = async () => {
    const tr = await fetchDeepl();
    if (!tr) return;
    setTranslations((prev) => ({
      ...prev,
      titleES: hasRealContent(prev.titleES) ? prev.titleES : (tr.translations.titleES || ""),
      subtitleES: hasRealContent(prev.subtitleES) ? prev.subtitleES : (tr.translations.subtitleES || ""),
      previewES: hasRealContent(prev.previewES) ? prev.previewES : (stripHtml(tr.translations.previewTextES) || ""),
      contentES: hasRealContent(prev.contentES) ? prev.contentES : (cleanContentHtml(tr.translations.contentES || "") || ""),
      additionalInfoES: hasRealContent(prev.additionalInfoES) ? prev.additionalInfoES : (tr.translations.additionalInfoES || ""),
    }));

    // 🖼️ Rellenar traducciones de imágenes
    if (tr.imageTranslations) {
      setImageTranslations((prev) => {
        const updated = { ...prev };
        for (const [imgId, trans] of Object.entries(tr.imageTranslations)) {
          updated[imgId] = {
            titleES: prev[imgId]?.titleES || trans.titleES || "",
            altES: prev[imgId]?.altES || trans.altES || "",
          };
        }
        return updated;
      });
    }
  };

  // Rellena solo un campo concreto (opcionalmente forzar pisado)
  const fillFieldFromDeepl = async (
    stateKey,
    deeplKey,
    { force = false } = {},
  ) => {
    const tr = await fetchDeepl();
    if (!tr) return;
    setTranslations((prev) => {
      if (!force && hasRealContent(prev[stateKey])) return prev;
      // contentES y additionalInfoES conservan HTML para preservar estructura/links
      let value;
      if (stateKey === "contentES") {
        value = cleanContentHtml(tr.translations[deeplKey] || "");
      } else if (stateKey === "additionalInfoES") {
        value = tr.translations[deeplKey] || "";
      } else {
        value = stripHtml(tr.translations[deeplKey]) || "";
      }
      return { ...prev, [stateKey]: value };
    });
  };
  // El artículo ya está aprobado/publicado en ES — el botón de guardado no
  // lo manda a borrador (el backend lo mantiene "approved", ver PUT), así que
  // el label no debe decir "borrador" para no confundir a quien solo está
  // corrigiendo un artículo ya publicado (p. ej. tildando esIsOriginal).
  const isApprovedArticle = article?.translationStatus === "approved";

  return (
    <div className="translate-page max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">
        🌐 Traducir artículo al español
      </h1>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={fillAllFromDeepl}
          disabled={deeplLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          title="Autotraducir todos los campos (no pisa lo ya escrito)"
        >
          ⚡ Autotraducir con DeepL
        </button>

        {deeplError && (
          <span className="text-red-600 text-sm">DeepL: {deeplError}</span>
        )}

        <label
          className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors select-none ${
            esIsOriginal
              ? "bg-purple-50 border-purple-400 text-purple-800"
              : "bg-white border-gray-300 text-gray-600 hover:border-purple-300"
          }`}
          title="Marcar cuando el texto en español no es una traducción, sino la fuente original (p. ej. artículo escrito originalmente en español y traducido al alemán para el impreso)"
        >
          <input
            type="checkbox"
            checked={esIsOriginal}
            onChange={(e) => setEsIsOriginal(e.target.checked)}
            className="accent-purple-600 w-4 h-4"
          />
          🌎 Es texto original en español, no traducción
        </label>
      </div>
      <form className="grid grid-cols-2 gap-6 text-sm">
        {/* Título */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.title)}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Título (alemán)</label>
          </div>
          <p className="field-readonly mt-1">{article.title}</p>
        </div>
        <div>
          <label className="font-bold">Título (español)</label>
          <div className="flex gap-2">
            <input
              name="titleES"
              value={translations.titleES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  titleES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("titleES", "titleES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>
        {/* Subtítulo */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.subtitle || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Subtítulo (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.subtitle) || "—"}
          </p>
        </div>

        <div>
          <label className="font-bold">Subtítulo (español)</label>
          <div className="flex gap-2">
            <input
              name="subtitleES"
              value={translations.subtitleES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  subtitleES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("subtitleES", "subtitleES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.previewText || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Preview Text (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.previewText) || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Preview Text (español)</label>
          <div className="flex gap-2">
            <textarea
              name="previewES"
              value={translations.previewES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded h-24 flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  previewES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("previewES", "previewTextES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Contenido — vista compacta (click en el campo ES abre el editor) */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold">Contenido</label>
            <span className="text-xs text-gray-400">Click en el campo español para traducir</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Alemán — compacto */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Alemán (original)</p>
              <div
                className="border p-2 rounded h-40 overflow-y-auto article-content text-gray-700"
                dangerouslySetInnerHTML={{ __html: normalizeForDisplay(article.content) || "—" }}
              />
            </div>
            {/* Español — compacto (solo lectura, click abre el modal) */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Español (traducción)</p>
              <div
                ref={contentEditableRef}
                role="button"
                tabIndex={0}
                onClick={() => setIsContentModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsContentModalOpen(true);
                  }
                }}
                title="Click para abrir el editor de traducción"
                className="border p-2 rounded h-40 overflow-y-auto article-content text-gray-700 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("contentES", "contentES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
            >
              ⚡ Autotraducir contenido
            </button>
          </div>
        </div>

        {/* ── Modal pantalla completa ───────────────────────────────────── */}
        {isContentModalOpen && (
          <div
            className="fixed inset-0 z-[9999] bg-white flex flex-col"
            onClick={() => { if (linkPopover) setLinkPopover(null); }}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-gray-800">Contenido — traducción</h2>
                <button
                  type="button"
                  onClick={() => fillFieldFromDeepl("contentES", "contentES")}
                  disabled={deeplLoading}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded disabled:opacity-50"
                >
                  ⚡ Autotraducir con DeepL
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={modalSaveState === "saving"}
                  onClick={async () => {
                    setModalSaveState("saving");
                    // Párrafo del CONTENIDO que está arriba en la vista: se
                    // persiste en la BD para restaurar el scroll al reabrir el
                    // modal la próxima vez (en cualquier dispositivo).
                    const scrollIndex = getTopVisibleBlockIndex();
                    try {
                      const res = await fetch(`/api/articles/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...translations,
                          translationStatus: "in_progress",
                          imageTranslations,
                          translationScrollES: scrollIndex,
                          esIsOriginal,
                        }),
                      });
                      setModalSaveState(res.ok ? "saved" : "error");
                      if (res.ok) savedScrollIndexRef.current = scrollIndex;
                    } catch {
                      setModalSaveState("error");
                    }
                    setTimeout(() => setModalSaveState("idle"), 2000);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-white text-sm rounded transition-colors disabled:opacity-70 ${
                    modalSaveState === "saved"
                      ? "bg-green-600"
                      : modalSaveState === "error"
                        ? "bg-red-600"
                        : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {modalSaveState === "saving"
                    ? "⏳ Guardando…"
                    : modalSaveState === "saved"
                      ? "✓ Guardado"
                      : modalSaveState === "error"
                        ? "❌ Error"
                        : isApprovedArticle
                          ? "💾 Guardar cambios"
                          : "💾 Guardar borrador"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsContentModalOpen(false)}
                  className="text-gray-500 hover:text-black text-sm flex items-center gap-1"
                >
                  ✕ Cerrar (Esc)
                </button>
              </div>
            </div>

            {/* Dos columnas */}
            <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">
              {/* Columna izquierda — alemán */}
              <div className="flex flex-col overflow-hidden shrink-0" style={{ width: `${splitPercent}%` }}>
                <div className="px-4 py-2 bg-gray-100 border-b shrink-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alemán (original)</span>
                </div>
                <div
                  className="flex-1 overflow-y-auto p-6 article-content text-gray-700"
                  dangerouslySetInnerHTML={{ __html: normalizeForDisplay(article.content) || "—" }}
                />
              </div>

              {/* Barra divisoria arrastrable */}
              <div
                onMouseDown={handleDividerMouseDown}
                className="w-1.5 shrink-0 bg-gray-200 hover:bg-[#BD0E0D] transition-colors cursor-col-resize flex items-center justify-center group"
                title="Arrastra para redimensionar"
              >
                <div className="w-px h-8 bg-gray-400 group-hover:bg-white rounded-full" />
              </div>

              {/* Columna derecha — español editable */}
              <div className="flex flex-col overflow-hidden flex-1">
                {/* Header + mini toolbar */}
                <div className="px-4 py-2 bg-purple-50 border-b shrink-0 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Español (traducción editable)</span>
                  {/* Formatting toolbar */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Negrita"
                      onMouseDown={(e) => { e.preventDefault(); execModal("bold"); }}
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs font-black transition-colors ${activeFormats.bold ? "bg-purple-200 text-purple-900" : "text-gray-500 hover:text-gray-900 hover:bg-purple-100"}`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      title="Cursiva"
                      onMouseDown={(e) => { e.preventDefault(); execModal("italic"); }}
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs italic transition-colors ${activeFormats.italic ? "bg-purple-200 text-purple-900" : "text-gray-500 hover:text-gray-900 hover:bg-purple-100"}`}
                    >
                      I
                    </button>
                    <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                    <button
                      type="button"
                      title="Título de sección (H3)"
                      onMouseDown={(e) => { e.preventDefault(); setBlockTag("h3"); }}
                      className={`px-1.5 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${activeFormats.block === "h3" ? "bg-purple-200 text-purple-900" : "text-gray-500 hover:text-gray-900 hover:bg-purple-100"}`}
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      title="Pregunta / subtítulo (H4)"
                      onMouseDown={(e) => { e.preventDefault(); setBlockTag("h4"); }}
                      className={`px-1.5 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${activeFormats.block === "h4" ? "bg-purple-200 text-purple-900" : "text-gray-500 hover:text-gray-900 hover:bg-purple-100"}`}
                    >
                      H4
                    </button>
                    <button
                      type="button"
                      title="Párrafo normal"
                      onMouseDown={(e) => { e.preventDefault(); setBlockTag("p"); }}
                      className={`px-1.5 h-6 flex items-center justify-center rounded text-[10px] transition-colors ${activeFormats.block === "p" ? "bg-purple-200 text-purple-900" : "text-gray-500 hover:text-gray-900 hover:bg-purple-100"}`}
                    >
                      ¶
                    </button>
                    <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                    <button
                      type="button"
                      title="Insertar enlace"
                      onMouseDown={handleModalLink}
                      className="w-6 h-6 flex items-center justify-center rounded text-xs text-gray-500 hover:text-gray-900 hover:bg-purple-100 transition-colors"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      title="Enlace a dossier ila"
                      onMouseDown={handleDossierClick}
                      className="w-6 h-6 flex items-center justify-center rounded text-xs text-gray-500 hover:text-gray-900 hover:bg-purple-100 transition-colors"
                    >
                      📕
                    </button>
                  </div>
                </div>
                <div
                  ref={contentEditableModalRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const html = normalizeDivsToParagraphs(stripFigureWrappers(e.currentTarget.innerHTML));
                    setTranslations((prev) => ({ ...prev, contentES: html }));
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/plain");
                    const clipHtml = e.clipboardData.getData("text/html");
                    insertFormattedHtml(e.currentTarget, formatPastedHtml(text, clipHtml));
                  }}
                  onKeyDown={handleEditorKeyDown}
                  onMouseUp={handleModalMouseUp}
                  onKeyUp={(e) => { saveModalSelection(); updateActiveFormats(); }}
                  className="flex-1 overflow-y-auto p-6 article-content text-gray-700 focus:outline-none"
                />
              </div>
            </div>

            {/* ── Link popover ── */}
            {linkPopover && (
              <div
                className="fixed z-[999999] bg-white border border-gray-200 rounded-xl shadow-xl p-3 min-w-[260px] max-w-[400px]"
                style={{ left: linkPopover.x, top: linkPopover.y }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {linkEditMode ? (
                  // Edit URL input
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={linkEditUrl}
                      onChange={(e) => setLinkEditUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyLinkEdit();
                        if (e.key === "Escape") setLinkEditMode(false);
                      }}
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-purple-400"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={applyLinkEdit}
                      className="px-2 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkEditMode(false)}
                      className="px-2 py-1.5 text-gray-400 text-xs hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  // Show URL + actions
                  <div className="flex items-center gap-2">
                    {linkPopover.isDossier ? (
                      // Dossier link — show edition number from data attribute
                      <span className="flex-1 text-xs font-bold text-[#BD0E0D] truncate">
                        📕 {linkPopover.editionNumber ? `ila ${linkPopover.editionNumber}` : linkPopover.linkText}
                      </span>
                    ) : (
                      // Regular link — show URL
                      <a
                        href={linkPopover.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-blue-600 underline truncate hover:text-blue-800"
                        title={linkPopover.href}
                      >
                        {linkPopover.href}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (linkPopover.isDossier) {
                          // Open dossier picker
                          if (dossierEditions.length === 0) {
                            setLoadingDossierEditions(true);
                            try {
                              const res = await fetch("/api/editions");
                              const data = await res.json();
                              setDossierEditions(data.sort((a, b) => b.number - a.number));
                            } catch {}
                            setLoadingDossierEditions(false);
                          }
                          setShowDossierModal(true);
                        } else {
                          setLinkEditUrl(linkPopover.href);
                          setLinkEditMode(true);
                        }
                      }}
                      className="shrink-0 text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                      title={linkPopover.isDossier ? "Cambiar dossier" : "Editar enlace"}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={removeLinkFromPopover}
                      className="shrink-0 text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
                      title="Eliminar enlace"
                    >
                      🗑️
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkPopover(null)}
                      className="shrink-0 text-gray-300 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dossier picker */}
            {showDossierModal && (
              <div
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50"
                onClick={() => setShowDossierModal(false)}
              >
                <div
                  className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col"
                  style={{ maxHeight: "60vh" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-bold text-gray-900 mb-4 text-sm">
                    📕 Enlace a dossier ila
                  </h3>
                  {loadingDossierEditions ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-y-auto flex-1 space-y-0.5">
                      {dossierEditions.map((edition) => (
                        <button
                          key={edition.id}
                          type="button"
                          onClick={() => handleDossierSelect(edition)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                          <span className="font-bold text-[#BD0E0D]">ila {edition.number}</span>
                          <span className="text-gray-600 ml-2 text-xs">{edition.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDossierModal(false)}
                    className="mt-4 text-xs text-gray-400 hover:text-gray-600 self-end"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.additionalInfo || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Información adicional (alemán)</label>
          </div>
          <div
            className="field-readonly mt-1 article-content [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:hover:underline"
            dangerouslySetInnerHTML={{
              __html: plainToHtmlAdditionalInfo(article.additionalInfo || "") || "—",
            }}
          />
        </div>
        <div>
          <label className="font-bold">Información adicional (español)</label>
          <div className="flex gap-2">
            <div
              ref={additionalInfoEditableRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                const html = e.currentTarget.innerHTML;
                setTranslations((prev) => ({ ...prev, additionalInfoES: html }));
              }}
              className="border p-2 w-full rounded min-h-24 flex-1 article-content [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:hover:underline focus:outline-none focus:border-purple-400"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  additionalInfoES: plainToHtmlAdditionalInfo(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() =>
                fillFieldFromDeepl("additionalInfoES", "additionalInfoES")
              }
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>
        {/* 🖼️ SECCIÓN DE IMÁGENES */}
        {images.length > 0 && (
          <div className="col-span-2 mt-8 border-t pt-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">
              🖼️ Traducir información de imágenes
            </h2>

            {images.map((img, idx) => (
              <div
                key={img.id}
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex gap-4 mb-3">
                  <img
                    src={img.url}
                    alt={img.alt || "Imagen"}
                    className="w-32 h-32 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Imagen {idx + 1}
                    </p>

                    {/* Title/Caption */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(img.title || "")}
                            className="text-gray-500 hover:text-black"
                            title="Copiar"
                          >
                            <Copy size={14} />
                          </button>
                          <label className="text-xs font-bold">
                            Título/Caption (alemán)
                          </label>
                        </div>
                        <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border">
                          {img.title || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold">
                          Título/Caption (español)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imageTranslations[img.id]?.titleES || ""}
                            onChange={(e) => {
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  titleES: e.target.value,
                                },
                              }));
                            }}
                            className="border p-2 w-full rounded text-sm flex-1"
                            placeholder="Traducir título..."
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText();
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  titleES: stripHtml(text),
                                },
                              }));
                            }}
                            className="px-2 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                            title="Pegar desde portapapeles"
                          >
                            📥
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const tr = await fetchDeepl();
                              if (tr?.imageTranslations?.[img.id]?.titleES) {
                                setImageTranslations((prev) => ({
                                  ...prev,
                                  [img.id]: {
                                    ...prev[img.id],
                                    titleES:
                                      prev[img.id]?.titleES ||
                                      tr.imageTranslations[img.id].titleES,
                                  },
                                }));
                              }
                            }}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
                            title="Rellenar con DeepL"
                          >
                            ⚡
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alt text */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(img.alt || "")}
                            className="text-gray-500 hover:text-black"
                            title="Copiar"
                          >
                            <Copy size={14} />
                          </button>
                          <label className="text-xs font-bold">
                            Alt text (alemán)
                          </label>
                        </div>
                        <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border">
                          {img.alt || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold">
                          Alt text (español)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imageTranslations[img.id]?.altES || ""}
                            onChange={(e) => {
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  altES: e.target.value,
                                },
                              }));
                            }}
                            className="border p-2 w-full rounded text-sm flex-1"
                            placeholder="Traducir alt text..."
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText();
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  altES: stripHtml(text),
                                },
                              }));
                            }}
                            className="px-2 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                            title="Pegar desde portapapeles"
                          >
                            📥
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const tr = await fetchDeepl();
                              if (tr?.imageTranslations?.[img.id]?.altES) {
                                setImageTranslations((prev) => ({
                                  ...prev,
                                  [img.id]: {
                                    ...prev[img.id],
                                    altES:
                                      prev[img.id]?.altES ||
                                      tr.imageTranslations[img.id].altES,
                                  },
                                }));
                              }
                            }}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
                            title="Rellenar con DeepL"
                          >
                            ⚡
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* 🖼️ INLINE IMAGES */}
        {inlineImages.length > 0 && (
          <div className="col-span-2 mt-8 border-t pt-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              🖼️ Inline-Bilder: Credit / Alt übersetzen
            </h2>
            {inlineImages.map((img, idx) => (
              <div
                key={img.id}
                className="mb-4 p-4 bg-green-50 dark:bg-gray-800 rounded-lg border border-green-200"
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={img.url}
                    alt={img.alt || "Inline-Bild"}
                    className="w-24 h-20 object-cover rounded border flex-shrink-0"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {/* Credit / title */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">
                        Credit DE
                      </label>
                      <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border min-h-[2rem]">
                        {img.title || <span className="text-gray-400">—</span>}
                      </p>
                      <label className="text-xs font-bold text-gray-700 block mt-2 mb-1">
                        Credit ES
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={imageTranslations[img.id]?.titleES || ""}
                          onChange={(e) =>
                            setImageTranslations((prev) => ({
                              ...prev,
                              [img.id]: { ...prev[img.id], titleES: e.target.value },
                            }))
                          }
                          placeholder="Credit / Bildnachweis (ES)…"
                          className="border p-2 w-full rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(img.title || "")}
                          className="px-2 text-gray-400 hover:text-black"
                          title="Copiar original"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Alt text */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">
                        Alt-Text DE
                      </label>
                      <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border min-h-[2rem]">
                        {img.alt || <span className="text-gray-400">—</span>}
                      </p>
                      <label className="text-xs font-bold text-gray-700 block mt-2 mb-1">
                        Alt-Text ES
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={imageTranslations[img.id]?.altES || ""}
                          onChange={(e) =>
                            setImageTranslations((prev) => ({
                              ...prev,
                              [img.id]: { ...prev[img.id], altES: e.target.value },
                            }))
                          }
                          placeholder="Alt-Text (ES)…"
                          className="border p-2 w-full rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(img.alt || "")}
                          className="px-2 text-gray-400 hover:text-black"
                          title="Copiar original"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón guardar */}
        <div className="col-span-2 flex justify-end mt-4">
          {isReviewMode ? (
            <button
              type="button"
              onClick={async () => {
                const confirm = window.confirm(
                  "¿Estás seguro de aprobar esta traducción?",
                );
                if (!confirm) return;

                const res = await fetch(`/api/articles/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...translations,
                    translationStatus: "approved",
                    imageTranslations,
                    esIsOriginal,
                  }),
                });

                if (res.ok) {
                  await fetch("/api/activity-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      articleId: id,
                      action: "REVIEW_TRANSLATION",
                    }),
                  });

                  alert("✅ Traducción revisada y aprobada");
                  router.replace("/dashboard/articles?mode=reviewer");
                } else {
                  alert("❌ Error al aprobar la traducción");
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              ✅ Aprobar traducción
            </button>
          ) : (
            <div className="flex gap-3">
              {/* Guardar borrador — guarda también alt/title de imágenes (el PUT
                  procesa imageTranslations y parchea el contentES) */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...translations,
                      translationStatus: "in_progress",
                      imageTranslations,
                      esIsOriginal,
                    }),
                  });

                  if (res.ok) {
                    alert(
                      isApprovedArticle
                        ? "💾 Cambios guardados"
                        : "💾 Traducción guardada como borrador",
                    );
                    router.replace(afterDraftUrl);
                  } else {
                    alert("❌ Error al guardar");
                  }
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                {isApprovedArticle ? "💾 Guardar cambios" : "💾 Guardar borrador"}
              </button>

              {/* Enviar traducción */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...translations,
                      translationStatus: "submitted",
                      imageTranslations,
                      esIsOriginal,
                    }),
                  });

                  if (res.ok) {
                    const updated = await res.json().catch(() => null);
                    if (updated?.translationStatus === "approved") {
                      alert("✅ Traducción aprobada directamente");
                    } else {
                      alert("📤 Traducción enviada para revisión");
                    }
                    router.replace("/dashboard/translators/assignments");
                  } else {
                    alert("❌ Error al enviar traducción");
                  }
                }}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                📤 Enviar traducción
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TranslateArticlePage;
