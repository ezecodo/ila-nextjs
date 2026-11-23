"use client";

// Paso 2 — Temas: el actual + los próximos (la redacción pidió 3 en total).
// Tarjetas plegables con resumen; los datos que faltan se marcan en el acto.

import { useState } from "react";
import { FaArrowUp, FaArrowDown, FaTrash, FaPlus, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { formatMonth, formatDate } from "@/lib/interletterEmail";
import { LangField, StatusIcon } from "./ui";
import { emptyTopic, inputCls, labelCls, btnSecondary } from "./shared";

function topicState(tp) {
  if (!tp.title?.de?.trim()) return tp.desc?.de?.trim() || tp.keywords?.de?.trim() ? "warn" : "empty";
  return tp.deadline && tp.number && tp.month ? "ok" : "warn";
}

export default function TopicsStep({ draft, setDraft, lang, t }) {
  const topics = draft.topics || [];
  // Abiertas por defecto: las que todavía no tienen título (hay que llenarlas).
  const [open, setOpen] = useState(() => new Set(topics.filter((tp) => !tp.title?.de?.trim()).map((tp) => tp.key)));

  const update = (key, patch) =>
    setDraft((d) => ({ ...d, topics: d.topics.map((tp) => (tp.key === key ? { ...tp, ...patch } : tp)) }));
  const move = (idx, dir) =>
    setDraft((d) => {
      const arr = [...d.topics];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...d, topics: arr };
    });
  const remove = (tp) => {
    if ((tp.title?.de || tp.desc?.de) && !confirm(t("confirmRemoveTopic"))) return;
    setDraft((d) => ({ ...d, topics: d.topics.filter((x) => x.key !== tp.key) }));
  };
  const add = () => {
    const tp = emptyTopic();
    setDraft((d) => ({ ...d, topics: [...d.topics, tp] }));
    setOpen((s) => new Set(s).add(tp.key));
  };
  const toggle = (key) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  return (
    <div className="space-y-4">
      {topics.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
          {t("noTopics")}
        </div>
      )}

      {topics.map((tp, idx) => {
        const isOpen = open.has(tp.key);
        const state = topicState(tp);
        const title = tp.title?.de?.trim();
        const summary = [
          tp.number && `ila ${tp.number}`,
          tp.month && formatMonth(tp.month, "de"),
          tp.deadline && `${t("deadlineShort")} ${formatDate(tp.deadline, "de")}`,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <div key={tp.key} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Cabecera / resumen */}
            <div className="flex items-start gap-3 px-4 py-3">
              <button type="button" onClick={() => toggle(tp.key)} className="flex-1 min-w-0 text-left flex items-start gap-3">
                <span className="mt-1 text-gray-400">{isOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}</span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-[#BD0E0D]">
                    {idx === 0 ? t("topicCurrent") : t("topicNext", { n: idx })}
                  </span>
                  <span className={`block font-semibold truncate ${title ? "text-gray-900 dark:text-gray-100" : "text-gray-400 italic"}`}>
                    {title || t("topicUntitled")}
                  </span>
                  {summary && <span className="block text-xs text-gray-500">{summary}</span>}
                </span>
              </button>
              <span className="mt-1">{state !== "empty" && <StatusIcon state={state} />}</span>
              <div className="flex gap-1 text-gray-400">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 hover:text-gray-900 disabled:opacity-30" title={t("moveUp")}>
                  <FaArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === topics.length - 1}
                  className="p-1 hover:text-gray-900 disabled:opacity-30"
                  title={t("moveDown")}
                >
                  <FaArrowDown size={12} />
                </button>
                <button type="button" onClick={() => remove(tp)} className="p-1 hover:text-[#BD0E0D]" title={t("removeTopic")}>
                  <FaTrash size={12} />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="px-4 pb-5 pt-1 space-y-5 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <div className="space-y-1">
                    <label className={labelCls}>{t("fNumber")}</label>
                    <input
                      className={`${inputCls} ${title && !tp.number ? "border-amber-400" : ""}`}
                      inputMode="numeric"
                      value={tp.number}
                      placeholder="502"
                      onChange={(e) => update(tp.key, { number: e.target.value.replace(/[^\d/–-]/g, "") })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>{t("fMonth")}</label>
                    <input
                      type="month"
                      className={`${inputCls} ${title && !tp.month ? "border-amber-400" : ""}`}
                      value={tp.month}
                      onChange={(e) => update(tp.key, { month: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>{t("fDeadline")}</label>
                    <input
                      type="date"
                      className={`${inputCls} ${title && !tp.deadline ? "border-amber-400" : ""}`}
                      value={tp.deadline}
                      onChange={(e) => update(tp.key, { deadline: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 -mt-3">{t("fDeadlineHelp")}</p>

                <LangField
                  t={t}
                  lang={lang}
                  label={t("fTopicTitle")}
                  placeholder={t("fTopicTitlePh")}
                  value={tp.title}
                  onChange={(v) => update(tp.key, { title: v })}
                />
                <LangField
                  t={t}
                  lang={lang}
                  label={t("fKeywords")}
                  help={t("fKeywordsHelp")}
                  placeholder={t("fKeywordsPh")}
                  value={tp.keywords}
                  onChange={(v) => update(tp.key, { keywords: v })}
                />
                <LangField
                  t={t}
                  lang={lang}
                  rows={5}
                  label={t("fTopicDesc")}
                  help={t("fTopicDescHelp")}
                  value={tp.desc}
                  onChange={(v) => update(tp.key, { desc: v })}
                />
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={add} className={btnSecondary}>
        <FaPlus size={11} /> {t("addTopic")}
      </button>
      {topics.length > 3 && <p className="text-xs text-amber-600">{t("tooManyTopics")}</p>}
    </div>
  );
}
