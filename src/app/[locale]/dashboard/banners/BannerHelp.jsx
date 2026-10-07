"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

// Guía paso a paso para que el equipo arme y cambie banners sin pedírselo a nadie.
// Arranca abierta la primera vez; si la cierran, se recuerda (solo en este navegador).
const STORAGE_KEY = "ila-banner-help-closed";

export default function BannerHelp() {
  const t = useTranslations("bannerHelp");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "0" : "1");
    } catch {
      // sin storage: solo vale para esta visita
    }
  };

  const recipes = t.raw("recipes");
  const tips = t.raw("tips");

  return (
    <div className="mb-8 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <span className="font-semibold">❓ {t("title")}</span>
        <span className="text-sm text-gray-500">
          {open ? t("hide") : t("show")}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 space-y-5 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300 pt-3">
            {t("intro")}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map((recipe) => (
              <section
                key={recipe.title}
                className="border-l-4 border-[#BD0E0D] bg-gray-50 dark:bg-gray-900/40 p-4"
              >
                <h3 className="font-semibold mb-2">{recipe.title}</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {recipe.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <section>
            <h3 className="font-semibold mb-2">💡 {t("tipsTitle")}</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
