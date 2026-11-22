"use client";

// InterLetter — mailing a autor*innen, Illustrator*innen y Fotograf*innen
// (≈10/año): tema actual + los dos siguientes, para que propongan textos,
// fotos e ilustraciones. Diseño según el borrador de la redacción (ver
// comentario en src/lib/interletterEmail.js).
//
// Borrador: vive en localStorage (STORAGE_KEY) hasta que se envía; al enviar
// queda guardado en la BD (modelo Interletter, con el contenido completo) y
// desde el Archiv se puede reutilizar como borrador nuevo.
// Destinatarios: RecipientsPanel. Envío + archivo: SendPanel.

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FaEnvelopeOpenText,
  FaPlus,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaPaperPlane,
  FaDesktop,
  FaMobileAlt,
  FaLanguage,
  FaUndo,
  FaMagic,
} from "react-icons/fa";
import {
  renderInterletterEmail,
  interletterSubject,
  LANGS,
} from "@/lib/interletterEmail";
import { translateWithDeepl } from "@/lib/translateDeepl";
import RecipientsPanel from "./RecipientsPanel";
import SendPanel from "./SendPanel";
import { sampleDraft } from "./interletterSample";

// v2: el formato v1 (dossier + lista de temas DE/ES) quedó descartado con el
// diseño de la redacción; no se migra, era solo un borrador de prueba.
const STORAGE_KEY = "ila-interletter-draft-v2";
const FLAG = { de: "🇩🇪", es: "🇪🇸", pt: "🇧🇷" };
const DEEPL_TARGET = { es: "ES", pt: "PT-BR" };

// Textos estándar (editables) — basados en el borrador de la redacción.
const DEFAULT_TEXTS = {
  intro: {
    de: "Liebe Autor*innen, Illustrator*innen und Fotograf*innen,\n\nmit dem InterLetter erzählen wir euch, an welchen Schwerpunkten wir gerade arbeiten und welche Themen in den nächsten Ausgaben der ila kommen. Wir freuen uns über eure Vorschläge für Artikel, Fotos und Illustrationen!",
    es: "Queridas autoras y autores, ilustradoras e ilustradores, fotógrafas y fotógrafos:\n\ncon el InterLetter les contamos en qué temas centrales estamos trabajando y qué temas vienen en los próximos números de la ila. ¡Nos alegramos de recibir sus propuestas de artículos, fotos e ilustraciones!",
    pt: "Queridas autoras e autores, ilustradoras e ilustradores, fotógrafas e fotógrafos,\n\ncom o InterLetter contamos a vocês em quais temas estamos trabalhando e quais temas vêm nas próximas edições da ila. Ficamos felizes em receber suas propostas de artigos, fotos e ilustrações!",
  },
  participate: {
    de: "So macht ihr mit: Antwortet einfach auf diese E-Mail. Schreibt uns gerne, wenn ihr Ideen habt – zu den Schwerpunkten, aber auch für Hintergrundartikel – oder wenn ihr Fragen habt.\n\nIhr kennt Menschen, die für die ila schreiben, zeichnen oder fotografieren könnten? Leitet den InterLetter gerne weiter und bittet sie, sich bei uns zu melden. (Wer ihn weitergeleitet bekommt, steht damit nicht automatisch auf unserem Verteiler.)",
    es: "Cómo participar: basta con responder a este correo. Escríbannos si tienen ideas – sobre los temas centrales, pero también para artículos de contexto – o si tienen preguntas.\n\n¿Conocen a personas que podrían escribir, ilustrar o fotografiar para la ila? Reenvíenles el InterLetter y pídanles que se pongan en contacto con nosotros. (Quien lo recibe reenviado no queda automáticamente en nuestra lista.)",
    pt: "Como participar: basta responder a este e-mail. Escrevam para nós se tiverem ideias – sobre os temas centrais, mas também para artigos de contexto – ou se tiverem perguntas.\n\nConhecem pessoas que poderiam escrever, ilustrar ou fotografar para a ila? Encaminhem o InterLetter e peçam que entrem em contato conosco. (Quem o recebe encaminhado não entra automaticamente na nossa lista.)",
  },
  closing: {
    de: "Herzliche Grüße\neuer Redaktionsteam der ila",
    es: "Un saludo cordial\nel equipo de redacción de la ila",
    pt: "Um abraço\na equipe de redação da ila",
  },
};

const L = () => ({ de: "", es: "", pt: "" });

const emptyTopic = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  number: "",
  month: "", // "YYYY-MM" — se formatea solo por idioma
  deadline: "", // "YYYY-MM-DD"
  title: L(),
  keywords: L(),
  desc: L(),
});

const defaultDraft = () => ({
  languages: { de: true, es: true, pt: false },
  subject: { de: "ila InterLetter", es: "InterLetter de la ila", pt: "InterLetter da ila" },
  preheader: L(),
  intro: { ...DEFAULT_TEXTS.intro },
  topics: [emptyTopic(), emptyTopic(), emptyTopic()],
  participate: { ...DEFAULT_TEXTS.participate },
  notes: L(),
  closing: { ...DEFAULT_TEXTS.closing },
});

// Campos por idioma del borrador (para DeepL y el contador de pendientes).
const TEXT_FIELDS = ["subject", "preheader", "intro", "participate", "notes", "closing"];
const TOPIC_FIELDS = ["title", "keywords", "desc"];

function missingCount(draft, lang) {
  let n = 0;
  for (const f of TEXT_FIELDS) if (draft[f]?.de?.trim() && !draft[f]?.[lang]?.trim()) n++;
  for (const tp of draft.topics)
    for (const f of TOPIC_FIELDS) if (tp[f]?.de?.trim() && !tp[f]?.[lang]?.trim()) n++;
  return n;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#BD0E0D]";
const labelCls = "block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1";

// Un campo en el idioma que se está editando; en ES/PT muestra el alemán
// como referencia encima.
function LangField({ label, hint, value, onChange, lang, rows, placeholder }) {
  const Tag = rows ? "textarea" : "input";
  return (
    <div>
      <label className={labelCls}>
        {label} <span className="font-normal">{FLAG[lang]}</span>
      </label>
      {lang !== "de" && value?.de?.trim() && (
        <div className="text-[11px] text-gray-400 mb-1 whitespace-pre-line line-clamp-3 border-l-2 border-gray-200 pl-2">
          {FLAG.de} {value.de}
        </div>
      )}
      <Tag
        className={inputCls}
        rows={rows}
        value={value?.[lang] || ""}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function InterletterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("interletter");

  const [draft, setDraft] = useState(defaultDraft);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("text");
  const [editLang, setEditLang] = useState("de");
  const [viewport, setViewport] = useState("desktop");
  const [translating, setTranslating] = useState(false);
  const [sendState, setSendState] = useState({ status: "idle", msg: "" });
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...defaultDraft(), ...JSON.parse(saved) });
    } catch {
      /* borrador corrupto: se arranca de cero */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)), 400);
    return () => clearTimeout(id);
  }, [draft, loaded]);

  const set = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);
  const activeLangs = LANGS.filter((l) => draft.languages[l]);

  // Si se desactiva el idioma que se está editando, volver al alemán.
  useEffect(() => {
    if (!draft.languages[editLang]) setEditLang("de");
  }, [draft.languages, editLang]);

  const updateTopic = (key, patch) =>
    setDraft((d) => ({
      ...d,
      topics: d.topics.map((tp) => (tp.key === key ? { ...tp, ...patch } : tp)),
    }));
  const moveTopic = (idx, dir) =>
    setDraft((d) => {
      const arr = [...d.topics];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...d, topics: arr };
    });

  // DeepL: completa SOLO los campos ES/PT vacíos de los idiomas activos (no
  // pisa lo ya corregido a mano).
  async function fillTranslations() {
    setTranslating(true);
    try {
      const targets = activeLangs.filter((l) => l !== "de");
      const next = structuredClone(draft);
      for (const lang of targets) {
        for (const f of TEXT_FIELDS) {
          if (next[f]?.de?.trim() && !next[f]?.[lang]?.trim()) {
            next[f][lang] = await translateWithDeepl(next[f].de, "DE", DEEPL_TARGET[lang]);
          }
        }
        for (const tp of next.topics) {
          for (const f of TOPIC_FIELDS) {
            if (tp[f]?.de?.trim() && !tp[f]?.[lang]?.trim()) {
              tp[f][lang] = await translateWithDeepl(tp[f].de, "DE", DEEPL_TARGET[lang]);
            }
          }
        }
      }
      setDraft(next);
    } finally {
      setTranslating(false);
    }
  }

  function loadSample() {
    if (!confirm(t("confirmSample"))) return;
    setDraft(sampleDraft());
    setSendState({ status: "idle", msg: "" });
  }

  function resetDraft() {
    if (!confirm(t("confirmReset"))) return;
    setDraft(defaultDraft());
    setSendState({ status: "idle", msg: "" });
  }

  async function sendTest() {
    setSendState({ status: "sending", msg: "" });
    try {
      const res = await fetch("/api/admin/interletter/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSendState({ status: "ok", msg: t("testSent", { email: data.to }) });
    } catch (e) {
      setSendState({ status: "error", msg: `${t("testError")}: ${e.message}` });
    }
  }

  const html = useMemo(
    () => (origin ? renderInterletterEmail(draft, { assetBase: origin }) : ""),
    [draft, origin],
  );
  const subject = interletterSubject(draft);

  const tabs = [
    { id: "text", label: t("tabContent") },
    { id: "topics", label: `${t("tabTopics")} (${draft.topics.length})` },
    { id: "recipients", label: t("tabRecipients") },
    { id: "send", label: t("tabSend") },
  ];

  if (!loaded) return null;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FaEnvelopeOpenText className="text-[#BD0E0D]" /> InterLetter
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillTranslations}
            disabled={translating || activeLangs.length < 2}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
            title={t("deeplHint")}
          >
            <FaLanguage /> {translating ? t("translating") : t("deeplFill")}
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            title={t("sampleHint")}
          >
            <FaMagic /> {t("loadSample")}
          </button>
          <button
            type="button"
            onClick={resetDraft}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <FaUndo /> {t("reset")}
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
        {t("draftLocalNotice")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* ── Editor ── */}
        <div className="min-w-0">
          {/* Idiomas del envío + idioma que se edita */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("languages")}:</span>
              {LANGS.map((l) => (
                <label key={l} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#BD0E0D]"
                    checked={!!draft.languages[l]}
                    disabled={l === "de"}
                    onChange={(e) => set({ languages: { ...draft.languages, [l]: e.target.checked } })}
                  />
                  {FLAG[l]} {t(`lang_${l}`)}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">{t("editing")}:</span>
              {activeLangs.map((l) => {
                const miss = l === "de" ? 0 : missingCount(draft, l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setEditLang(l)}
                    className={`px-2 py-1 text-xs rounded border ${
                      editLang === l
                        ? "border-[#BD0E0D] text-[#BD0E0D] font-bold"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    }`}
                    title={miss ? t("missingHint", { count: miss }) : undefined}
                  >
                    {FLAG[l]} {l.toUpperCase()}
                    {miss > 0 && (
                      <span className="ml-1 inline-block min-w-[16px] px-1 rounded-full bg-amber-500 text-white text-[10px]">
                        {miss}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${
                  tab === tb.id
                    ? "border-[#BD0E0D] text-[#BD0E0D]"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "text" && (
            <div className="space-y-4">
              <LangField label={t("subject")} lang={editLang} value={draft.subject} onChange={(v) => set({ subject: v })} />
              <LangField
                label={t("preheader")}
                hint={t("preheaderHint")}
                lang={editLang}
                value={draft.preheader}
                onChange={(v) => set({ preheader: v })}
              />
              <LangField
                label={t("introText")}
                hint={t("introHint")}
                lang={editLang}
                rows={7}
                value={draft.intro}
                onChange={(v) => set({ intro: v })}
              />
              <LangField
                label={t("participate")}
                hint={t("participateHint")}
                lang={editLang}
                rows={8}
                value={draft.participate}
                onChange={(v) => set({ participate: v })}
              />
              <LangField
                label={t("notes")}
                hint={t("notesHint")}
                lang={editLang}
                rows={3}
                value={draft.notes}
                onChange={(v) => set({ notes: v })}
              />
              <LangField label={t("closing")} lang={editLang} rows={2} value={draft.closing} onChange={(v) => set({ closing: v })} />
              <p className="text-[11px] text-gray-400">{t("paragraphHint")}</p>
            </div>
          )}

          {tab === "topics" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("topicsIntro")}</p>
              {draft.topics.map((tp, idx) => (
                <div
                  key={tp.key}
                  className="border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#BD0E0D]">
                      {idx === 0 ? t("topicCurrent") : t("topicNext", { n: idx })}
                    </span>
                    <div className="flex gap-1 text-gray-500">
                      <button type="button" onClick={() => moveTopic(idx, -1)} className="p-1 hover:text-gray-900" title="↑">
                        <FaArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveTopic(idx, 1)} className="p-1 hover:text-gray-900" title="↓">
                        <FaArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, topics: d.topics.filter((x) => x.key !== tp.key) }))}
                        className="p-1 hover:text-red-600"
                        title={t("removeTopic")}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>{t("topicNumber")}</label>
                      <input
                        className={inputCls}
                        value={tp.number}
                        placeholder="502"
                        onChange={(e) => updateTopic(tp.key, { number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t("topicMonth")}</label>
                      <input
                        type="month"
                        className={inputCls}
                        value={tp.month}
                        onChange={(e) => updateTopic(tp.key, { month: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t("topicDeadline")}</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={tp.deadline}
                        onChange={(e) => updateTopic(tp.key, { deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 -mt-1">{t("topicDeadlineHint")}</p>
                  <LangField
                    label={t("topicTitle")}
                    lang={editLang}
                    value={tp.title}
                    onChange={(v) => updateTopic(tp.key, { title: v })}
                  />
                  <LangField
                    label={t("topicKeywords")}
                    hint={t("topicKeywordsHint")}
                    lang={editLang}
                    value={tp.keywords}
                    onChange={(v) => updateTopic(tp.key, { keywords: v })}
                  />
                  <LangField
                    label={t("topicDesc")}
                    lang={editLang}
                    rows={5}
                    value={tp.desc}
                    onChange={(v) => updateTopic(tp.key, { desc: v })}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, topics: [...d.topics, emptyTopic()] }))}
                className="px-4 py-2 text-sm font-semibold rounded-md bg-[#BD0E0D] hover:bg-[#a50c0b] text-white flex items-center gap-2"
              >
                <FaPlus /> {t("addTopic")}
              </button>
            </div>
          )}

          {tab === "recipients" && <RecipientsPanel />}

          {tab === "send" && (
            <SendPanel
              draft={draft}
              onReuse={(content) => {
                setDraft({ ...defaultDraft(), ...content });
                setTab("text");
              }}
            />
          )}
        </div>

        {/* ── Vorschau ── */}
        <div className="min-w-0 lg:sticky lg:top-6 self-start">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t("preview")}</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`p-2 rounded ${viewport === "desktop" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                title="Desktop"
              >
                <FaDesktop />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`p-2 rounded ${viewport === "mobile" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                title="Mobile"
              >
                <FaMobileAlt />
              </button>
            </div>
          </div>
          <div className="text-xs mb-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md truncate">
            <span className="text-gray-500">{t("subject")}:</span> <span className="font-semibold">{subject}</span>
          </div>
          <div className="flex justify-center bg-[#f2f2ef] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <iframe
              title="InterLetter Vorschau"
              srcDoc={html}
              sandbox=""
              className="bg-[#f2f2ef]"
              style={{
                width: viewport === "mobile" ? 375 : "100%",
                height: "calc(100vh - 260px)",
                minHeight: 500,
                border: 0,
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={sendTest}
              disabled={sendState.status === "sending"}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-[#BD0E0D] hover:bg-[#a50c0b] text-white flex items-center gap-2 disabled:opacity-50"
            >
              <FaPaperPlane /> {sendState.status === "sending" ? t("sending") : t("sendTest")}
            </button>
            <span className="text-xs text-gray-500">{t("sendTestHint", { email: session?.user?.email || "" })}</span>
          </div>
          {sendState.msg && (
            <p className={`mt-2 text-sm ${sendState.status === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
              {sendState.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
