// Constantes y helpers del módulo InterLetter (dashboard). Sin JSX.

export const LANGS = ["de", "es", "pt"];
// Sin banderas (pedido de la AG Web, 2026-11-24): una bandera es un país, no
// un idioma (🇪🇸 para el español de América Latina no va). Se deja el nombre
// FLAG para no tocar todos los usos.
export const FLAG = { de: "DE", es: "ES", pt: "PT" };
export const DEEPL_TARGET = { es: "ES", pt: "PT-BR" };

// Campos traducibles: del mail y de cada tema.
export const TEXT_FIELDS = ["subject", "preheader", "intro", "participate", "notes", "closing"];
export const TOPIC_FIELDS = ["title", "keywords", "desc"];

export const STEPS = ["content", "topics", "recipients", "review"];

export const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#BD0E0D] focus:border-transparent";
export const labelCls = "block text-sm font-semibold text-gray-800 dark:text-gray-200";
export const btnPrimary =
  "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-[#BD0E0D] hover:bg-[#a50c0b] text-white disabled:opacity-50 disabled:cursor-not-allowed";
export const btnSecondary =
  "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";

// Textos estándar (editables) — basados en el borrador de la redacción.
export const DEFAULT_TEXTS = {
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

export const emptyTopic = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  number: "",
  month: "", // "YYYY-MM" — se formatea solo por idioma
  deadline: "", // "YYYY-MM-DD"
  title: L(),
  keywords: L(),
  desc: L(),
});

export const defaultDraft = () => ({
  languages: { de: true, es: true, pt: false },
  subject: { de: "ila InterLetter", es: "InterLetter de la ila", pt: "InterLetter da ila" },
  preheader: L(),
  intro: { ...DEFAULT_TEXTS.intro },
  topics: [emptyTopic(), emptyTopic(), emptyTopic()],
  participate: { ...DEFAULT_TEXTS.participate },
  notes: L(),
  closing: { ...DEFAULT_TEXTS.closing },
});

// Copia un InterLetter como punto de partida del siguiente: conserva textos
// e idiomas; los temas se corren (el "nächste" pasa a ser el actual) y se
// suma uno vacío al final.
export function nextFromPrevious(content) {
  const base = { ...defaultDraft(), ...structuredClone(content) };
  const topics = (base.topics || []).slice(1).map((tp) => ({ ...tp, key: emptyTopic().key }));
  while (topics.length < 3) topics.push(emptyTopic());
  return { ...base, topics };
}

// Cuántos campos con texto en alemán ya tienen su versión en `lang`.
export function translationProgress(draft, lang) {
  let total = 0;
  let done = 0;
  const count = (obj) => {
    if (!obj?.de?.trim()) return;
    total++;
    if (obj?.[lang]?.trim()) done++;
  };
  TEXT_FIELDS.forEach((f) => count(draft[f]));
  (draft.topics || []).forEach((tp) => TOPIC_FIELDS.forEach((f) => count(tp[f])));
  return { done, total };
}

export function activeLangList(draft) {
  return LANGS.filter((l) => draft?.languages?.[l]);
}

// Problemas por paso: { level: "error" | "warn", key, params, step }.
// "error" bloquea el envío; "warn" solo avisa.
export function draftIssues(draft, activeRecipients) {
  const issues = [];
  if (!draft.subject?.de?.trim()) issues.push({ level: "error", key: "issueNoSubject", step: "content" });
  if (!draft.intro?.de?.trim()) issues.push({ level: "warn", key: "issueNoIntro", step: "content" });

  const topics = draft.topics || [];
  const withTitle = topics.filter((tp) => tp.title?.de?.trim());
  if (!withTitle.length) issues.push({ level: "error", key: "issueNoTopic", step: "topics" });
  topics.forEach((tp, i) => {
    if (!tp.title?.de?.trim()) {
      if (tp.desc?.de?.trim() || tp.keywords?.de?.trim())
        issues.push({ level: "warn", key: "issueTopicNoTitle", params: { n: i + 1 }, step: "topics" });
      return;
    }
    if (!tp.deadline) issues.push({ level: "warn", key: "issueTopicNoDeadline", params: { n: i + 1 }, step: "topics" });
    if (!tp.number || !tp.month)
      issues.push({ level: "warn", key: "issueTopicNoIssue", params: { n: i + 1 }, step: "topics" });
  });

  activeLangList(draft)
    .filter((l) => l !== "de")
    .forEach((l) => {
      const { done, total } = translationProgress(draft, l);
      if (done < total)
        issues.push({
          level: "warn",
          key: "issueTranslation",
          params: { lang: l.toUpperCase(), missing: total - done },
          step: "content",
        });
    });

  if (activeRecipients === 0) issues.push({ level: "error", key: "issueNoRecipients", step: "recipients" });
  return issues;
}

export function stepState(step, issues) {
  const mine = issues.filter((i) => i.step === step);
  if (mine.some((i) => i.level === "error")) return "error";
  if (mine.length) return "warn";
  return "ok";
}

export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
