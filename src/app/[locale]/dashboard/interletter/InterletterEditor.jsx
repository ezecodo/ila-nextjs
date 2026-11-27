"use client";

// Editor de UN InterLetter (borrador guardado en la BD).
// - Asistente de 4 pasos con estado por paso (✓ / aviso / falta algo).
// - Guardado automático (PUT con control de conflicto: si otra persona de la
//   AG Web guardó en el medio, avisa en vez de pisar sus cambios).
// - Barra de idiomas: qué idiomas lleva el mail + en cuál se está editando.
// - Vista previa en vivo = mismo HTML que se envía (renderInterletterEmail).

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaDesktop,
  FaMobileAlt,
  FaLanguage,
  FaCheck,
  FaTrash,
  FaMagic,
} from "react-icons/fa";
import { renderInterletterEmail, interletterSubject } from "@/lib/interletterEmail";
import { translateWithDeepl } from "@/lib/translateDeepl";
import ContentStep from "./ContentStep";
import TopicsStep from "./TopicsStep";
import RecipientsPanel from "./RecipientsPanel";
import ReviewStep from "./ReviewStep";
import InterletterFaq from "./InterletterFaq";
import { StatusIcon, HelpBox } from "./ui";
import { sampleDraft } from "./interletterSample";
import {
  LANGS,
  FLAG,
  STEPS,
  DEEPL_TARGET,
  TEXT_FIELDS,
  TOPIC_FIELDS,
  defaultDraft,
  translationProgress,
  activeLangList,
  draftIssues,
  stepState,
  formatDateTime,
  btnPrimary,
  btnSecondary,
} from "./shared";

const AUTOSAVE_MS = 1200;

export default function InterletterEditor({ id, t, sessionEmail, onBack, onSent }) {
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState("draft");
  const [loadError, setLoadError] = useState("");
  const [save, setSave] = useState({ state: "idle" }); // idle | dirty | saving | saved | error | conflict
  const [step, setStep] = useState("content");
  const [lang, setLang] = useState("de");
  const [viewport, setViewport] = useState("desktop");
  const [activeCount, setActiveCount] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [testState, setTestState] = useState({ status: "idle" });
  const [origin, setOrigin] = useState("");

  const baseRef = useRef(null); // updatedAt de la versión sobre la que editamos
  const draftRef = useRef(null);
  const timerRef = useRef(null);
  const loadedRef = useRef(false);

  // ── Carga ──
  const load = useCallback(async () => {
    setLoadError("");
    loadedRef.current = false;
    const r = await fetch(`/api/admin/interletter/${id}`);
    const d = await r.json();
    if (!r.ok) return setLoadError(d.error || "Error");
    setDraft({ ...defaultDraft(), ...d.content });
    setStatus(d.status);
    baseRef.current = d.updatedAt;
    setSave({ state: "saved", at: d.updatedAt, by: d.updatedByEmail });
  }, [id]);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
    fetch("/api/admin/interletter/recipients")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setActiveCount(d.filter((x) => !x.unsubscribedAt).length))
      .catch(() => {});
  }, [load]);

  // ── Guardado ──
  const doSave = useCallback(
    async (force = false) => {
      clearTimeout(timerRef.current);
      const content = draftRef.current;
      if (!content) return true;
      setSave((s) => ({ ...s, state: "saving" }));
      try {
        const r = await fetch(`/api/admin/interletter/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, baseUpdatedAt: force ? null : baseRef.current }),
        });
        const d = await r.json();
        if (r.status === 409 && d.error === "conflict") {
          setSave({ state: "conflict", at: d.updatedAt, by: d.updatedByEmail });
          return false;
        }
        if (!r.ok) throw new Error(d.error || "Error");
        baseRef.current = d.updatedAt;
        setSave({ state: "saved", at: d.updatedAt, by: d.updatedByEmail });
        return true;
      } catch (e) {
        setSave({ state: "error", msg: e.message });
        return false;
      }
    },
    [id],
  );

  useEffect(() => {
    draftRef.current = draft;
    if (!draft) return;
    if (!loadedRef.current) {
      loadedRef.current = true; // primer render tras cargar: nada que guardar
      return;
    }
    if (save.state === "conflict") return; // no seguir guardando encima
    setSave((s) => (s.state === "saving" ? s : { ...s, state: "dirty" }));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(), AUTOSAVE_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Avisar si se cierra la pestaña con cambios sin guardar.
  useEffect(() => {
    const h = (e) => {
      if (["dirty", "saving"].includes(save.state)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [save.state]);

  const set = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);

  // ── Idiomas ──
  const langs = draft ? activeLangList(draft) : ["de"];
  useEffect(() => {
    if (draft && !draft.languages?.[lang]) setLang("de");
  }, [draft, lang]);

  async function fillTranslations() {
    setTranslating(true);
    try {
      const next = structuredClone(draftRef.current);
      for (const l of langs.filter((x) => x !== "de")) {
        for (const f of TEXT_FIELDS) {
          if (next[f]?.de?.trim() && !next[f]?.[l]?.trim()) next[f][l] = await translateWithDeepl(next[f].de, "DE", DEEPL_TARGET[l]);
        }
        for (const tp of next.topics) {
          for (const f of TOPIC_FIELDS) {
            if (tp[f]?.de?.trim() && !tp[f]?.[l]?.trim()) tp[f][l] = await translateWithDeepl(tp[f].de, "DE", DEEPL_TARGET[l]);
          }
        }
      }
      setDraft(next);
    } finally {
      setTranslating(false);
    }
  }

  // ── Testmail / envío ──
  const draftHash = useMemo(() => (draft ? JSON.stringify(draft) : ""), [draft]);
  const testView = { ...testState, stale: testState.status === "ok" && testState.hash !== draftHash };

  async function sendTest() {
    setTestState({ status: "sending" });
    try {
      const res = await fetch("/api/admin/interletter/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftRef.current),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setTestState({ status: "ok", to: d.to, hash: JSON.stringify(draftRef.current) });
    } catch (e) {
      setTestState({ status: "error", msg: `${t("testError")}: ${e.message}` });
    }
  }

  async function sendAll() {
    const ok = await doSave();
    if (!ok) throw new Error(t("saveBeforeSendFailed"));
    const res = await fetch("/api/admin/interletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, expectedCount: activeCount }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || t("sendError"));
    onSent({ id, sent: d.sent, failed: d.failed, content: draftRef.current });
  }

  async function deleteDraft() {
    if (!confirm(t("confirmDeleteDraft"))) return;
    clearTimeout(timerRef.current);
    await fetch(`/api/admin/interletter/${id}`, { method: "DELETE" });
    onBack();
  }

  function loadSample() {
    if (!confirm(t("confirmSample"))) return;
    setDraft(sampleDraft());
  }

  const html = useMemo(() => (draft && origin ? renderInterletterEmail(draft, { assetBase: origin }) : ""), [draft, origin]);

  // ── Render ──
  if (loadError) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-[#BD0E0D]">{loadError}</p>
        <button type="button" className={btnSecondary} onClick={onBack}>
          <FaArrowLeft /> {t("backToList")}
        </button>
      </div>
    );
  }
  if (!draft) return <p className="p-6 text-gray-400">…</p>;
  if (status !== "draft") {
    return (
      <div className="p-6 space-y-3">
        <p>{t("alreadySent")}</p>
        <button type="button" className={btnSecondary} onClick={onBack}>
          <FaArrowLeft /> {t("backToList")}
        </button>
      </div>
    );
  }

  const issues = draftIssues(draft, activeCount);
  const stepIdx = STEPS.indexOf(step);
  const stepLabel = { content: t("stepContent"), topics: t("stepTopics"), recipients: t("stepRecipients"), review: t("stepReview") };
  const stepHelp = { content: t("helpContent"), topics: t("helpTopics"), recipients: t("helpRecipients"), review: t("helpReview") };
  const showLangBar = step === "content" || step === "topics";

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={async () => {
              if (save.state === "dirty") await doSave(); // guardar lo pendiente, sin PUT de más
              onBack();
            }}
            className={btnSecondary}
          >
            <FaArrowLeft size={12} /> {t("backToList")}
          </button>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t("editingDraft")}</p>
            <h1 className="font-bold text-gray-900 dark:text-gray-100 truncate">{interletterSubject(draft)}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveIndicator save={save} t={t} />
          <InterletterFaq />
          <button type="button" onClick={loadSample} className={btnSecondary} title={t("sampleHint")}>
            <FaMagic size={12} /> {t("loadSample")}
          </button>
          <button type="button" onClick={deleteDraft} className={btnSecondary} title={t("deleteDraft")}>
            <FaTrash size={12} />
          </button>
        </div>
      </div>

      {save.state === "conflict" && (
        <div className="mb-4 p-3 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-900 dark:text-amber-100 flex flex-wrap items-center gap-3">
          <span className="flex-1">{t("conflictText", { who: save.by || "?", when: formatDateTime(save.at) })}</span>
          <button type="button" className={btnSecondary} onClick={load}>
            {t("conflictReload", { who: save.by || "?" })}
          </button>
          <button type="button" className={btnSecondary} onClick={() => doSave(true)}>
            {t("conflictOverwrite")}
          </button>
        </div>
      )}

      {/* Pasos */}
      <ol className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {STEPS.map((s, i) => {
          const st = s === "review" ? null : stepState(s, issues);
          const current = s === step;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => setStep(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b-4 transition-colors ${
                  current
                    ? "border-[#BD0E0D] bg-red-50/60 dark:bg-red-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                    current ? "bg-[#BD0E0D] text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`flex-1 text-sm ${current ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-300"}`}>
                  {stepLabel[s]}
                </span>
                {st && st !== "ok" && <StatusIcon state={st} size={12} />}
                {st === "ok" && <FaCheck size={11} className="text-green-600" />}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* Columna de edición */}
        <div className="min-w-0">
          <HelpBox id={`step-${step}`} closeLabel={t("close")}>
            <p>{stepHelp[step]}</p>
          </HelpBox>

          {showLangBar && (
            <div className="mb-5 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mr-1">{t("editIn")}</span>
                {langs.map((l) => {
                  const p = l === "de" ? null : translationProgress(draft, l);
                  const complete = !p || p.done === p.total;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`px-3 py-1.5 text-sm border rounded-md flex items-center gap-2 ${
                        lang === l
                          ? "border-[#BD0E0D] bg-white dark:bg-gray-900 font-bold text-[#BD0E0D]"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {FLAG[l]} {t(`lang_${l}`)}
                      {p && (
                        <span className={`text-[11px] font-normal ${complete ? "text-green-600" : "text-amber-600"}`}>
                          {p.done}/{p.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("mailLanguages")}</span>
                  {LANGS.map((l) => (
                    <label key={l} className={`flex items-center gap-1.5 ${l === "de" ? "opacity-60" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        className="accent-[#BD0E0D]"
                        checked={!!draft.languages?.[l]}
                        disabled={l === "de"}
                        onChange={(e) => set({ languages: { ...draft.languages, [l]: e.target.checked } })}
                      />
                      {FLAG[l]} {t(`lang_${l}`)}
                    </label>
                  ))}
                </div>
                {langs.length > 1 && (
                  <button type="button" onClick={fillTranslations} disabled={translating} className={btnSecondary} title={t("deeplHint")}>
                    <FaLanguage /> {translating ? t("translating") : t("deeplFill")}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "content" && <ContentStep draft={draft} set={set} lang={lang} t={t} />}
          {step === "topics" && <TopicsStep draft={draft} setDraft={setDraft} lang={lang} t={t} />}
          {step === "recipients" && <RecipientsPanel t={t} onCountChange={setActiveCount} />}
          {step === "review" && (
            <ReviewStep
              t={t}
              draft={draft}
              issues={issues}
              activeCount={activeCount}
              testState={testView}
              onSendTest={sendTest}
              onSend={sendAll}
              goStep={setStep}
              sessionEmail={sessionEmail}
            />
          )}

          {/* Navegación entre pasos */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            {stepIdx > 0 ? (
              <button type="button" className={btnSecondary} onClick={() => setStep(STEPS[stepIdx - 1])}>
                <FaArrowLeft size={11} /> {stepLabel[STEPS[stepIdx - 1]]}
              </button>
            ) : (
              <span />
            )}
            {stepIdx < STEPS.length - 1 && (
              <button type="button" className={btnPrimary} onClick={() => setStep(STEPS[stepIdx + 1])}>
                {t("next")}: {stepLabel[STEPS[stepIdx + 1]]} <FaArrowRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Vista previa */}
        <div className="min-w-0 xl:sticky xl:top-6 self-start">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t("preview")}</h2>
              <p className="text-xs text-gray-500">{t("previewHelp")}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`p-2 rounded ${viewport === "desktop" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                title={t("viewDesktop")}
              >
                <FaDesktop />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`p-2 rounded ${viewport === "mobile" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                title={t("viewMobile")}
              >
                <FaMobileAlt />
              </button>
            </div>
          </div>
          <div className="text-xs mb-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 truncate">
            <span className="text-gray-500">{t("fSubject")}:</span> <span className="font-semibold">{interletterSubject(draft)}</span>
          </div>
          <div className="flex justify-center bg-[#f2f2ef] border border-gray-200 dark:border-gray-700 overflow-hidden">
            <iframe
              title={t("preview")}
              srcDoc={html}
              sandbox=""
              className="bg-[#f2f2ef]"
              style={{ width: viewport === "mobile" ? 375 : "100%", height: "calc(100vh - 220px)", minHeight: 520, border: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ save, t }) {
  const base = "text-xs flex items-center gap-1.5";
  if (save.state === "saving") return <span className={`${base} text-gray-500`}>{t("saving")}</span>;
  if (save.state === "dirty") return <span className={`${base} text-gray-500`}>{t("unsaved")}</span>;
  if (save.state === "error") return <span className={`${base} text-[#BD0E0D]`}>{t("saveError")}</span>;
  if (save.state === "conflict") return <span className={`${base} text-amber-600`}>{t("saveConflict")}</span>;
  if (save.state === "saved")
    return (
      <span className={`${base} text-green-700 dark:text-green-400`} title={save.by || ""}>
        <FaCheck size={10} /> {t("saved", { when: formatDateTime(save.at) })}
      </span>
    );
  return null;
}
