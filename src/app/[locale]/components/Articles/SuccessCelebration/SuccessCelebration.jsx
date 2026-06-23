"use client";

import { useEffect } from "react";

export default function SuccessCelebration({
  open,
  total,
  title,
  countLabel,
  praise,
  closeLabel,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[scaleIn_0.25s_ease-out]">
        <div
          className="px-8 py-7 text-center text-white"
          style={{ background: "linear-gradient(135deg,#BD0E0D,#8f0a09)" }}
        >
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-black leading-tight">{title}</h2>
        </div>
        <div className="px-8 py-7 text-center">
          {typeof total === "number" && (
            <>
              <div className="text-5xl font-black text-[#BD0E0D] tabular-nums">
                {total.toLocaleString("de-DE")}
              </div>
              <p className="mt-1 text-sm text-gray-500">{countLabel}</p>
            </>
          )}
          <p className="mt-5 text-base font-semibold text-gray-800">{praise}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-[#BD0E0D] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#8f0a09]"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
