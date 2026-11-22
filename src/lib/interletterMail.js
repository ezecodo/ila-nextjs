// src/lib/interletterMail.js — SOLO servidor (usa Resend).
// Remitente y armado del mail por destinatario del InterLetter. El HTML
// sale de renderInterletterEmail (src/lib/interletterEmail.js), el mismo que
// muestra la Vorschau.
import { readFile } from "fs/promises";
import path from "path";
import { Resend } from "resend";
import {
  renderInterletterEmail,
  interletterSubject,
  activeLangs,
} from "@/lib/interletterEmail";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Propuesto a ila (pendiente de confirmación): ila-web.de ya está verificado
// en Resend. Las respuestas van al buzón real de la redacción.
export const INTERLETTER_FROM = "ila InterLetter <interletter@ila-web.de>";
export const INTERLETTER_REPLY_TO = "ila-bonn@t-online.de";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.ila-web.de").replace(/\/$/, "");

// Página de baja (pide confirmar con un botón: los escáneres de correo abren
// los links solos, un GET nunca da de baja).
export function unsubscribePageUrl(token, draft) {
  const lang = activeLangs(draft)[0] === "es" ? "es" : "de";
  return `${APP_URL}/${lang}/interletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

// Endpoint para la baja "en un clic" del propio programa de correo (RFC 8058).
export function oneClickUnsubscribeUrl(token) {
  return `${APP_URL}/api/interletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

// Un mail (formato de resend.batch.send) para un destinatario.
// `htmlOpts` se pasa a renderInterletterEmail (p. ej. headerSrc para la Testmail).
export function buildInterletterMessage(draft, recipient, htmlOpts = {}) {
  return {
    from: INTERLETTER_FROM,
    to: [recipient.email],
    replyTo: INTERLETTER_REPLY_TO,
    subject: interletterSubject(draft),
    html: renderInterletterEmail(draft, {
      ...htmlOpts,
      unsubscribeUrl: unsubscribePageUrl(recipient.unsubscribeToken, draft),
    }),
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl(recipient.unsubscribeToken)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

// Headers como imágenes embebidas (cid:) — solo para la Testmail: funciona
// aunque los PNG todavía no estén deployados. El envío real usa la URL
// pública (resend.batch no admite adjuntos y los mails pesan menos).
export async function inlineHeaderAttachments(draft) {
  const langs = activeLangs(draft);
  const attachments = await Promise.all(
    langs.map(async (lang) => ({
      filename: `ila-interletter-${lang}.png`,
      content: await readFile(path.join(process.cwd(), "public", "interletter", `header-${lang}.png`)),
      contentType: "image/png",
      inlineContentId: `ila-header-${lang}`,
    })),
  );
  return { attachments, headerSrc: (lang) => `cid:ila-header-${lang}` };
}
