"use client";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "default", // "default" | "danger"
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-[#BD0E0D] hover:bg-[#a50c0b] text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        {message && (
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
