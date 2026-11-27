"use client";

// Preguntas frecuentes del InterLetter: botón que abre una ventana con
// buscador y preguntas plegables, agrupadas por tema. Los textos viven en
// messages/*.json → interletterFaq.sections (mismo criterio que BannerHelp:
// t.raw para traer la estructura entera).
//
// Si cambia el funcionamiento del módulo (rotación de temas, envío, baja…),
// actualizar también estas respuestas.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaQuestionCircle, FaSearch } from "react-icons/fa";
import { Modal } from "./ui";
import { btnSecondary, inputCls } from "./shared";

export default function InterletterFaq() {
  const t = useTranslations("interletterFaq");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sections = t.raw("sections");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((it) => `${it.q} ${it.a}`.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length);
  }, [sections, query]);

  const searching = !!query.trim();

  return (
    <>
      <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>
        <FaQuestionCircle className="text-[#BD0E0D]" /> {t("button")}
      </button>

      {open && (
        <Modal wide title={t("title")} onClose={() => setOpen(false)}>
          <div className="space-y-5 text-sm">
            <p className="text-gray-600 dark:text-gray-300">{t("intro")}</p>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                className={`${inputCls} pl-8`}
                placeholder={t("search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {filtered.length === 0 && <p className="text-gray-500">{t("noResults")}</p>}

            {filtered.map((s, si) => (
              <section key={s.title}>
                <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 mb-2">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-[#BD0E0D] text-white text-xs flex items-center justify-center">
                    {si + 1}
                  </span>
                  {s.title}
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                  {s.items.map((it) => (
                    // key con la búsqueda: al buscar se re-montan abiertas.
                    <details key={`${it.q}-${searching}`} open={searching} className="group">
                      <summary className="cursor-pointer list-none flex items-start gap-2 px-3 py-2.5 font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="text-[#BD0E0D] mt-0.5 transition-transform group-open:rotate-90">▸</span>
                        <span className="flex-1">{it.q}</span>
                      </summary>
                      <div className="px-3 pb-3 pl-8 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {it.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}

            <p className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-3">{t("footer")}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
