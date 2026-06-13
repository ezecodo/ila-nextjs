"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function ArticlePriorityButton({ edition }) {
  const t = useTranslations("dossiers");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [list, setList] = useState([]);
  // true cuando el usuario "restablece" → se manda order vacío (todo a prioridad 0)
  const [untouched, setUntouched] = useState(false);

  const titleOf = (a) =>
    locale === "es" ? a.titleES || a.title : a.title;

  const openModal = async () => {
    setOpen(true);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/editions/${edition.id}/article-priority`);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando artículos:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const move = (index, dir) => {
    setSaved(false);
    setUntouched(false);
    setList((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const reset = () => {
    setSaved(false);
    setList((prev) => prev.map((a) => ({ ...a, frontpagePriority: 0 })));
    setUntouched(true);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const order = untouched ? [] : list.map((a) => a.id);
      const res = await fetch(`/api/editions/${edition.id}/article-priority`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
      setUntouched(false);
    } catch (e) {
      console.error("Error guardando prioridad:", e);
      alert(t("prioritySaveError") || "Error al guardar el orden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs rounded transition-colors font-medium bg-purple-600 hover:bg-purple-700"
        title={t("priorityButtonTitle") || "Prioridad de artículos en el frontpage"}
      >
        ↕️ {t("priorityButton") || "Prioridad"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400">
                  {t("priorityModalTitle") || "Prioridad en el frontpage"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  N° {edition.number} — {titleOf(edition)}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-3 overflow-y-auto flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t("priorityHint") ||
                  "El orden de arriba hacia abajo define qué artículos aparecen primero en el frontpage. Sin prioridad, se ordenan por fecha."}
              </p>

              {loading ? (
                <p className="text-center text-gray-500 py-8">
                  {t("loadingEditions") || "Cargando..."}
                </p>
              ) : list.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {t("priorityNoArticles") ||
                    "Este dossier no tiene artículos publicados."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {list.map((a, i) => {
                    const authorNames = (a.authors || [])
                      .map((au) => au.name)
                      .filter(Boolean)
                      .join(", ");
                    const pubDate = a.publicationDate
                      ? new Date(a.publicationDate)
                      : null;
                    const endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);
                    const scheduled = pubDate && pubDate > endOfToday;
                    const noImage = !a.imageUrl;
                    const pubDateLabel = pubDate
                      ? pubDate.toLocaleDateString(
                          locale === "es" ? "es-ES" : "de-DE",
                          { day: "2-digit", month: "2-digit", year: "numeric" },
                        )
                      : null;
                    return (
                      <li
                        key={a.id}
                        className={`flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 ${
                          scheduled || noImage ? "opacity-70" : ""
                        }`}
                      >
                        <span className="w-6 text-center text-base font-bold text-purple-600 dark:text-purple-400 shrink-0">
                          {i + 1}
                        </span>
                        {a.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.imageUrl}
                            alt=""
                            className="w-16 h-16 object-cover rounded shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xl shrink-0">
                            🗎
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
                            {titleOf(a)}
                          </p>
                          {authorNames && (
                            <p className="text-xs text-[#BD0E0D] mt-0.5 truncate">
                              {authorNames}
                            </p>
                          )}
                          {(scheduled || noImage) && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {scheduled && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  📅 {t("priorityScheduled", { date: pubDateLabel })}
                                </span>
                              )}
                              {noImage && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  🚫 {t("priorityNoImageBadge")}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            className="px-2 py-0.5 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => move(i, 1)}
                            disabled={i === list.length - 1}
                            className="px-2 py-0.5 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={reset}
                disabled={list.length === 0}
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40"
              >
                {t("priorityReset") || "Restablecer (por fecha)"}
              </button>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-sm text-green-600">
                    ✓ {t("prioritySaved") || "Guardado"}
                  </span>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t("cancel") || "Cerrar"}
                </button>
                <button
                  onClick={save}
                  disabled={saving || loading}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving
                    ? t("prioritySaving") || "Guardando..."
                    : t("prioritySave") || "Guardar orden"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
