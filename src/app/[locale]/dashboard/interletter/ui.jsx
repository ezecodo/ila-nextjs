"use client";

// Piezas de interfaz chicas del módulo InterLetter.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import { FLAG, inputCls, labelCls } from "./shared";

export function StatusIcon({ state, size = 14 }) {
  if (state === "ok") return <FaCheckCircle size={size} className="text-green-600 shrink-0" />;
  if (state === "warn") return <FaExclamationTriangle size={size} className="text-amber-500 shrink-0" />;
  if (state === "error") return <FaTimesCircle size={size} className="text-[#BD0E0D] shrink-0" />;
  return null;
}

// Campo de texto en el idioma que se está editando. En ES/PT muestra el
// alemán encima como referencia, y avisa que si queda vacío sale el alemán.
export function LangField({ label, help, value, onChange, lang, rows, placeholder, t }) {
  const Tag = rows ? "textarea" : "input";
  const de = value?.de?.trim();
  const mine = value?.[lang]?.trim();
  return (
    <div className="space-y-1">
      <label className={labelCls}>
        {label} <span className="font-normal text-gray-400">{FLAG[lang]}</span>
      </label>
      {help && <p className="text-xs text-gray-500 dark:text-gray-400">{help}</p>}
      {lang !== "de" && de && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 border-l-2 border-gray-300 dark:border-gray-600 px-2 py-1 whitespace-pre-line max-h-24 overflow-y-auto">
          <span className="font-semibold">{FLAG.de} Deutsch:</span> {value.de}
        </div>
      )}
      <Tag
        className={`${inputCls} ${lang !== "de" && de && !mine ? "border-amber-400 dark:border-amber-500" : ""}`}
        rows={rows}
        value={value?.[lang] || ""}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
      />
      {lang !== "de" && de && !mine && t && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{t("fieldFallback")}</p>
      )}
    </div>
  );
}

// Recuadro de ayuda que se puede cerrar (recuerda el cierre en este navegador).
export function HelpBox({ id, title, children, closeLabel }) {
  const storageKey = `ila-interletter-help-${id}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(localStorage.getItem(storageKey) !== "closed");
  }, [storageKey]);
  if (!open) return null;
  return (
    <div className="relative flex gap-3 p-4 mb-5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-100">
      <FaInfoCircle className="mt-0.5 shrink-0 text-blue-500" />
      <div className="space-y-1 pr-6">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(storageKey, "closed");
          setOpen(false);
        }}
        className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-700"
        title={closeLabel}
        aria-label={closeLabel}
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Portal a <body>: ningún contenedor del dashboard lo recorta.
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-white dark:bg-gray-900 w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] flex flex-col shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900" aria-label="✕">
              <FaTimes />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
