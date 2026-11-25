// src/lib/interletterEmail.js
//
// Arma el HTML del InterLetter (mailing a autor*innen, Illustrator*innen y
// Fotograf*innen de ila). Función PURA, sin dependencias de servidor: la usa
// la Vorschau del dashboard (<iframe srcDoc>) y el endpoint de envío → lo que
// se ve en la Vorschau es exactamente lo que llega. No duplicar el template.
//
// Diseño según el borrador de la redacción ("Design ila inter-letter", con
// los comentarios de LV, nov-2026):
// - Header = el de la web (PNG en public/interletter/header-<lang>.png,
//   captura del header real; se repite al empezar cada idioma).
// - Texto negro sobre blanco, Myriad Pro (la del Heft) con fallbacks — los
//   clientes de correo solo la muestran si está instalada.
// - SIN recuadros rojos (accesibilidad: blanco sobre rojo cuesta leer):
//   título del tema en rojo/negrita, resto en negro; fechas en rojo.
// - Tema actual + los dos siguientes. Cada uno: Nr./mes, título, 2–4
//   Stichworte, descripción, fecha de entrega de textos terminados.
// - NO mezclar con "gerade erschienen" (no es publicidad del Heft).
// - Bloque "so macht ihr mit" + saludo del Redaktionsteam.
// - Separador entre idiomas: ******. Al final: línea + botón de baja.

export const LANGS = ["de", "es", "pt"];
const SITE = "https://www.ila-web.de";
const RED = "#BD0E0D";
const FONT = "'Myriad Pro', Myriad, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const LOCALE = { de: "de-DE", es: "es-ES", pt: "pt-BR" };
// Subir al regenerar los PNG del header (rompe la caché del navegador y del
// proxy de imágenes de Gmail). Los PNG son capturas del header REAL de la web
// (Chrome headless sobre /de y /es, menú oculto, animaciones congeladas).
const HEADER_VERSION = 2;

const COPY = {
  de: {
    headerAlt: "ila – Das Lateinamerika-Magazin",
    current: "Aktuelles Thema",
    next: "Die nächsten Themen",
    keywords: "Stichworte",
    deadline: "Abgabe fertiger Texte",
    unsubscribe: "InterLetter abbestellen",
    unsubscribeWhy:
      "Ihr bekommt den InterLetter, weil ihr mit der ila zusammenarbeitet. Wer ihn weitergeleitet bekommt, steht damit nicht auf dem Verteiler.",
  },
  es: {
    headerAlt: "ila – La revista de América Latina",
    current: "Tema actual",
    next: "Los próximos temas",
    keywords: "Palabras clave",
    deadline: "Entrega de textos terminados",
    unsubscribe: "Darse de baja del InterLetter",
    unsubscribeWhy:
      "Reciben el InterLetter porque colaboran con la ila. Quien lo recibe reenviado no queda por eso en la lista.",
  },
  pt: {
    headerAlt: "ila – A revista da América Latina",
    current: "Tema atual",
    next: "Os próximos temas",
    keywords: "Palavras-chave",
    deadline: "Entrega dos textos finalizados",
    unsubscribe: "Cancelar o InterLetter",
    unsubscribeWhy:
      "Vocês recebem o InterLetter porque colaboram com a ila. Quem o recebe encaminhado não entra automaticamente na lista.",
  },
};

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Texto plano → párrafos (línea en blanco = párrafo nuevo, salto simple = <br>).
function paragraphs(text, style) {
  return String(text || "")
    .trim()
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p) => `<p style="${style}">${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// "2027-02" → "Februar 2027" / "febrero de 2027" / "fevereiro de 2027"
export function formatMonth(ym, lang) {
  if (!/^\d{4}-\d{2}$/.test(ym || "")) return "";
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString(LOCALE[lang], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "2027-01-15" → "15.01.2027" / "15/01/2027"
export function formatDate(iso, lang) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(LOCALE[lang], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Idiomas activos del borrador, en orden fijo DE → ES → PT.
export function activeLangs(draft) {
  const l = LANGS.filter((x) => draft?.languages?.[x]);
  return l.length ? l : ["de"];
}

// Valor de un campo por idioma; si falta, cae al alemán (mejor un texto en
// alemán que un hueco). La Vorschau marca aparte los campos sin traducir.
const pick = (obj, lang) => (obj?.[lang] || "").trim() || (obj?.de || "").trim();

// Compacto a pedido de la AG Web (reunión 2026-11-24, modelo en Word):
// cuerpo 15px / 1.4, poco aire entre párrafos y bloques.
const BODY = `margin:0 0 10px 0; font-family:${FONT}; font-size:15px; line-height:1.4; color:#000000;`;

function sectionLabel(text) {
  return `<p style="margin:22px 0 10px 0; font-family:${FONT}; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#000000; border-bottom:1px solid #dddddd; padding-bottom:4px;">${escapeHtml(text)}</p>`;
}

function renderTopic(tp, lang) {
  const c = COPY[lang];
  const month = formatMonth(tp.month, lang);
  const prefix = [tp.number ? `ila ${escapeHtml(tp.number)}` : "", month ? escapeHtml(month) : ""]
    .filter(Boolean)
    .join(" · ");
  const title = escapeHtml(pick(tp.title, lang));
  const kw = pick(tp.keywords, lang);
  const deadline = formatDate(tp.deadline, lang);
  return `
    <div style="margin:0 0 18px 0;">
      ${prefix ? `<p style="margin:0; font-family:${FONT}; font-size:13px; font-weight:700; color:${RED};">${prefix}</p>` : ""}
      <p style="margin:0 0 4px 0; font-family:${FONT}; font-size:20px; line-height:1.2; font-weight:700; color:${RED};">${title}</p>
      ${kw ? `<p style="margin:0 0 6px 0; font-family:${FONT}; font-size:15px; line-height:1.4; color:#000000;"><strong>${c.keywords}:</strong> ${escapeHtml(kw)}</p>` : ""}
      ${paragraphs(pick(tp.desc, lang), BODY)}
      ${deadline ? `<p style="margin:0; font-family:${FONT}; font-size:15px; color:#000000;"><strong>${c.deadline}:</strong> <strong style="color:${RED};">${deadline}</strong></p>` : ""}
    </div>`;
}

function renderLanguage(draft, lang, langs, headerSrc, isFirst) {
  const c = COPY[lang];
  const topics = (draft.topics || []).filter((tp) => pick(tp.title, lang));
  const [current, ...next] = topics;

  // Aviso "más abajo" solo en el primer idioma y si hay otros.
  let scroll = "";
  if (isFirst && langs.length > 1) {
    const notes = [];
    if (langs.includes("es")) notes.push("Versión en español más abajo");
    if (langs.includes("pt")) notes.push("Versão em português mais abaixo");
    scroll = `<p style="margin:0 0 14px 0; font-family:${FONT}; font-size:13px; color:#555555;">${notes.join(" · ")}</p>`;
  }

  return `
    <tr><td style="padding:0;"><img src="${headerSrc(lang)}" width="600" alt="${escapeHtml(c.headerAlt)}" style="display:block; width:100%; max-width:600px; height:auto; border:0;"></td></tr>
    <tr><td lang="${lang}" style="padding:24px 32px 4px 32px;">
      ${scroll}
      ${paragraphs(pick(draft.intro, lang), BODY)}
      ${current ? sectionLabel(c.current) + renderTopic(current, lang) : ""}
      ${next.length ? sectionLabel(c.next) + next.map((tp) => renderTopic(tp, lang)).join("") : ""}
      ${pick(draft.participate, lang) ? `<div style="margin:20px 0 0 0;">${paragraphs(pick(draft.participate, lang), BODY)}</div>` : ""}
      ${paragraphs(pick(draft.notes, lang), BODY)}
      ${paragraphs(pick(draft.closing, lang), BODY)}
    </td></tr>`;
}

/**
 * @param {object} draft — borrador del InterLetter (ver dashboard/interletter/page.js)
 * @param {object} [opts]
 * @param {string} [opts.assetBase] — origen de las imágenes del header (en la
 *   Vorschau local = window.location.origin; al enviar = producción)
 * @param {(lang: string) => string} [opts.headerSrc] — src del header por idioma
 *   (la Testmail usa "cid:…" con la imagen embebida, ver interletterMail.js)
 * @param {string} [opts.unsubscribeUrl] — link de baja por destinatario
 */
export function renderInterletterEmail(draft, opts = {}) {
  const langs = activeLangs(draft);
  const assetBase = opts.assetBase || SITE;
  const headerSrc =
    opts.headerSrc || ((lang) => `${assetBase}/interletter/header-${lang}.png?v=${HEADER_VERSION}`);
  const unsubscribeUrl = opts.unsubscribeUrl || "#";

  const separator = `<tr><td align="center" style="padding:14px 0 18px 0; font-family:${FONT}; font-size:18px; letter-spacing:0.5em; color:${RED};">******</td></tr>`;
  const body = langs
    .map((lang, i) => (i > 0 ? separator : "") + renderLanguage(draft, lang, langs, headerSrc, i === 0))
    .join("");

  const why = langs.map((l) => escapeHtml(COPY[l].unsubscribeWhy)).join("<br>");
  const btnLabel = langs.map((l) => COPY[l].unsubscribe).join(" / ");
  const preheader = escapeHtml(pick(draft.preheader, langs[0]));

  return `<!DOCTYPE html>
<html lang="${langs[0]}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(interletterSubject(draft))}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f2f2ef;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f2ef;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff;">
            ${body}
            <tr><td style="padding:4px 32px 26px 32px;">
              <hr style="border:0; border-top:1px solid #cccccc; margin:16px 0 22px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 16px auto;">
                <tr><td style="border:1px solid #888888; border-radius:4px;">
                  <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" style="display:inline-block; padding:10px 20px; font-family:${FONT}; font-size:14px; color:#333333; text-decoration:none;">${btnLabel}</a>
                </td></tr>
              </table>
              <p style="margin:0 0 12px 0; text-align:center; font-family:${FONT}; font-size:12px; line-height:1.5; color:#777777;">${why}</p>
              <p style="margin:0; text-align:center; font-family:${FONT}; font-size:12px; line-height:1.5; color:#777777;">
                <a href="${SITE}" style="color:${RED}; text-decoration:none; font-weight:700;">ila-web.de</a> · Informationsstelle Lateinamerika e.V. · Heerstr. 205 · 53111 Bonn
              </p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function interletterSubject(draft) {
  const langs = activeLangs(draft);
  const parts = langs.map((l) => (draft?.subject?.[l] || "").trim()).filter(Boolean);
  return [...new Set(parts)].join(" / ") || "ila InterLetter";
}

// Validación compartida (API de destinatarios + importación en el dashboard).
export const EMAIL_RE = /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/;

// "DE, es / pt" → "de,es,pt" (default "de")
export function cleanLanguages(v) {
  const list = String(v || "")
    .toLowerCase()
    .split(/[\s,;/]+/)
    .filter((l) => LANGS.includes(l));
  return [...new Set(list)].join(",") || "de";
}
