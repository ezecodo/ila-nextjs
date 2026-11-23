"use client";

// Paso 1 — Texto del mail: asunto, introducción, "So macht ihr mit",
// avisos y saludo. Se edita un idioma a la vez (barra de idiomas arriba).

import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { LangField } from "./ui";

export default function ContentStep({ draft, set, lang, t }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="space-y-6">
      <LangField
        t={t}
        lang={lang}
        label={t("fSubject")}
        help={t("fSubjectHelp")}
        placeholder={t("fSubjectPh")}
        value={draft.subject}
        onChange={(v) => set({ subject: v })}
      />
      <LangField
        t={t}
        lang={lang}
        rows={7}
        label={t("fIntro")}
        help={t("fIntroHelp")}
        value={draft.intro}
        onChange={(v) => set({ intro: v })}
      />
      <LangField
        t={t}
        lang={lang}
        rows={8}
        label={t("fParticipate")}
        help={t("fParticipateHelp")}
        value={draft.participate}
        onChange={(v) => set({ participate: v })}
      />
      <LangField
        t={t}
        lang={lang}
        rows={3}
        label={t("fNotes")}
        help={t("fNotesHelp")}
        placeholder={t("fNotesPh")}
        value={draft.notes}
        onChange={(v) => set({ notes: v })}
      />
      <LangField
        t={t}
        lang={lang}
        rows={2}
        label={t("fClosing")}
        value={draft.closing}
        onChange={(v) => set({ closing: v })}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900"
        >
          {showAdvanced ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />} {t("advanced")}
        </button>
        {showAdvanced && (
          <div className="mt-4">
            <LangField
              t={t}
              lang={lang}
              label={t("fPreheader")}
              help={t("fPreheaderHelp")}
              value={draft.preheader}
              onChange={(v) => set({ preheader: v })}
            />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">{t("paragraphHint")}</p>
    </div>
  );
}
