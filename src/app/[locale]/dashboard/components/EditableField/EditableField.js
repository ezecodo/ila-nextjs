"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function EditableField({
  label,
  original,
  value,
  onChange,
  className = "",
  multiline = false,
  rows = 3,
  placeholder = "",
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const t = useTranslations("editionTranslate");
  const isEmpty = !value || value.trim().length === 0;

  return (
    <div className="mb-6 relative group">
      {/* Label y botón para ver original */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-xs px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          title={showOriginal ? t("hideOriginal") : t("viewOriginal")}
        >
          {showOriginal ? `🙈 ${t("hideOriginal")}` : `🇩🇪 ${t("viewOriginal")}`}
        </button>
      </div>

      {/* Original alemán (colapsable) */}
      {showOriginal && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-3 border-l-4 border-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
              {t("original")}:
            </span>
            {/<\/?[a-z][\s\S]*>/i.test(original || "") ? (
              // ✅ Si tiene etiquetas HTML, renderízalo con formato
              <div
                className="flex-1 text-sm text-gray-800 dark:text-gray-200 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: original }}
              />
            ) : (
              // 🧾 Si no tiene HTML, se muestra como texto normal
              <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {original || "—"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campo editable */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            placeholder || `${t("original")}: ${label.toLowerCase()}`
          }
          rows={rows}
          className={`
            w-full p-3 rounded-lg
            border-2 border-dashed
            transition-all duration-200
            ${
              isEmpty
                ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:bg-red-50 dark:border-red-700 dark:bg-red-900/10"
                : "border-blue-300 bg-blue-50/30 focus:border-blue-500 focus:bg-blue-50 dark:border-blue-700 dark:bg-blue-900/10"
            }
            focus:outline-none focus:ring-2 
            ${isEmpty ? "focus:ring-red-200" : "focus:ring-blue-200"}
            dark:text-gray-200
            ${className}
          `}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            placeholder || `${t("original")}: ${label.toLowerCase()}`
          }
          className={`
            w-full p-3 rounded-lg
            border-2 border-dashed
            transition-all duration-200
            ${
              isEmpty
                ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:bg-red-50 dark:border-red-700 dark:bg-red-900/10"
                : "border-blue-300 bg-blue-50/30 focus:border-blue-500 focus:bg-blue-50 dark:border-blue-700 dark:bg-blue-900/10"
            }
            focus:outline-none focus:ring-2 
            ${isEmpty ? "focus:ring-red-200" : "focus:ring-blue-200"}
            dark:text-gray-200
            ${className}
          `}
        />
      )}

      {/* Indicador de estado */}
      <div className="flex items-center gap-2 mt-2">
        {isEmpty ? (
          <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {t("pending")}
          </span>
        ) : (
          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {t("translated", { count: value.length })}
          </span>
        )}
      </div>
    </div>
  );
}
