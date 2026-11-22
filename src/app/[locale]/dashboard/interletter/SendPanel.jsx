"use client";

// Versand + Archiv del InterLetter: revisión previa (avisos de campos
// faltantes), envío a todas las personas activas y archivo de lo enviado.

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { FaPaperPlane, FaEye, FaCopy, FaTimes } from "react-icons/fa";
import { renderInterletterEmail, activeLangs, LANGS } from "@/lib/interletterEmail";

// Límite diario del plan gratuito de Resend (incluye los mails transaccionales).
const DAILY_LIMIT = 100;

function warningsFor(draft, t) {
  const w = [];
  const langs = activeLangs(draft);
  const topics = draft.topics || [];
  if (!topics.some((tp) => tp.title?.de?.trim())) w.push(t("sdWarnNoTopic"));
  topics.forEach((tp, i) => {
    if (tp.title?.de?.trim() && !tp.deadline) w.push(t("sdWarnNoDeadline", { n: i + 1 }));
  });
  for (const l of langs.filter((x) => x !== "de")) {
    let n = 0;
    for (const f of ["subject", "intro", "participate", "notes", "closing"])
      if (draft[f]?.de?.trim() && !draft[f]?.[l]?.trim()) n++;
    for (const tp of topics)
      for (const f of ["title", "keywords", "desc"]) if (tp[f]?.de?.trim() && !tp[f]?.[l]?.trim()) n++;
    if (n) w.push(t("sdWarnMissing", { lang: l.toUpperCase(), count: n }));
  }
  return w;
}

export default function SendPanel({ draft, onReuse }) {
  const t = useTranslations("interletter");
  const [activeCount, setActiveCount] = useState(null);
  const [archive, setArchive] = useState([]);
  const [state, setState] = useState({ status: "idle", msg: "" });
  const [previewItem, setPreviewItem] = useState(null);

  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/admin/interletter/recipients").then((r) => r.json()),
      fetch("/api/admin/interletter").then((r) => r.json()),
    ]);
    setActiveCount(Array.isArray(r1) ? r1.filter((r) => !r.unsubscribedAt).length : 0);
    setArchive(Array.isArray(r2) ? r2 : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const warnings = warningsFor(draft, t);
  const langs = activeLangs(draft);

  async function send() {
    if (!confirm(t("sdConfirm", { count: activeCount }))) return;
    setState({ status: "sending", msg: "" });
    try {
      const res = await fetch("/api/admin/interletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, expectedCount: activeCount }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setState({
        status: d.failed ? "error" : "ok",
        msg: t("sdDone", { sent: d.sent }) + (d.failed ? ` ${t("sdFailed", { failed: d.failed })}` : ""),
      });
    } catch (e) {
      setState({ status: "error", msg: `${t("sdError")}: ${e.message}` });
    } finally {
      load();
    }
  }

  return (
    <div className="space-y-6 text-sm">
      <div className="p-4 border border-gray-200 dark:border-gray-700 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{t("sdTitle")}</h3>
        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
          <li>
            {t("sdRecipients", { count: activeCount ?? "…" })}
          </li>
          <li>
            {t("languages")}: {LANGS.filter((l) => langs.includes(l)).map((l) => l.toUpperCase()).join(" + ")}
          </li>
          <li className="font-mono text-xs">From: ila InterLetter &lt;interletter@ila-web.de&gt; · Reply-To: ila-bonn@t-online.de</li>
        </ul>
        {warnings.length > 0 && (
          <ul className="text-xs px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 list-disc pl-6 space-y-0.5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        {activeCount > DAILY_LIMIT && (
          <p className="text-xs text-red-600">{t("sdWarnLimit", { limit: DAILY_LIMIT })}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={send}
            disabled={!activeCount || state.status === "sending"}
            className="px-4 py-2 font-semibold rounded-md bg-[#BD0E0D] hover:bg-[#a50c0b] text-white flex items-center gap-2 disabled:opacity-50"
          >
            <FaPaperPlane /> {state.status === "sending" ? t("sending") : t("sdButton", { count: activeCount ?? 0 })}
          </button>
          <span className="text-[11px] text-gray-400">{t("sdHint")}</span>
        </div>
        {state.msg && (
          <p className={state.status === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600"}>{state.msg}</p>
        )}
      </div>

      {/* Archivo */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{t("arTitle")}</h3>
        {archive.length === 0 ? (
          <p className="text-gray-400">{t("arEmpty")}</p>
        ) : (
          <ul className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {archive.map((it) => (
              <li key={it.id} className="flex items-start gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{it.subject}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(it.sentAt).toLocaleString("de-DE")} · {t("arRecipients", { count: it.recipientCount })}
                    {it.failedCount > 0 && <span className="text-red-600"> · {t("arFailed", { count: it.failedCount })}</span>}
                    {it.sentByEmail && <span> · {it.sentByEmail}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setPreviewItem(it)} className="p-1 text-gray-500 hover:text-gray-900" title={t("arPreview")}>
                  <FaEye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => confirm(t("arConfirmReuse")) && onReuse(it.content)}
                  className="p-1 text-gray-500 hover:text-gray-900"
                  title={t("arReuse")}
                >
                  <FaCopy size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewItem &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-[700px] h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold truncate">{previewItem.subject}</span>
                <button type="button" onClick={() => setPreviewItem(null)} className="p-1" title={t("arClose")}>
                  <FaTimes />
                </button>
              </div>
              <iframe
                title="InterLetter Archiv"
                sandbox=""
                className="flex-1 w-full border-0 bg-[#f2f2ef]"
                srcDoc={renderInterletterEmail(previewItem.content, { assetBase: window.location.origin })}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
