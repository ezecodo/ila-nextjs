"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { FaUpload, FaTrash, FaFilePdf, FaCheck, FaSpinner, FaEye } from "react-icons/fa";

const BRAND_RED = "#BD0E0D";
const BRAND_RED_HOVER = "#A30C0B";

export default function DossiersSection() {
  const locale = useLocale();
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // editionId en proceso
  const [deleting, setDeleting] = useState(null);   // editionId en proceso
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchEditions();
  }, []);

  const fetchEditions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/editions?admin=true&limit=500&sortField=number&sortOrder=desc");
      const data = await res.json();
      setEditions(data?.items || []);
    } catch {
      showToast("Error al cargar ediciones", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (editionId, file) => {
    if (!file) return;
    setUploading(editionId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/editions/${editionId}/pdf-abo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      showToast("PDF subido correctamente");
      // Actualizar solo esa edición en el estado
      const updated = await res.json();
      setEditions((prev) =>
        prev.map((e) => (e.id === editionId ? { ...e, pdf: updated } : e))
      );
    } catch {
      showToast("Error al subir el PDF", "error");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (editionId) => {
    if (!confirm("¿Eliminar el PDF de este dossier?")) return;
    setDeleting(editionId);
    try {
      const res = await fetch(`/api/editions/${editionId}/pdf-abo`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("PDF eliminado");
      setEditions((prev) =>
        prev.map((e) => (e.id === editionId ? { ...e, pdf: null } : e))
      );
    } catch {
      showToast("Error al eliminar el PDF", "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border-l-4 bg-white min-w-[280px] ${
            toast.type === "error" ? "border-red-500 text-red-700" : "border-[#89B881] text-gray-700"
          }`}
        >
          {toast.type === "error" ? "✗" : "✓"} {toast.msg}
        </div>
      )}

      {/* Header sección */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          Dossiers{" "}
          <span style={{ color: BRAND_RED }}>PDF-Abo</span>
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Sube el PDF completo de cada edición. Solo los suscriptores con PDF-Abo tendrán acceso.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <FaSpinner className="animate-spin text-2xl text-gray-400" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Nº</th>
                <th className="px-6 py-4">Dossier</th>
                <th className="px-6 py-4">Estado PDF</th>
                <th className="px-6 py-4">Tamaño</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editions.map((edition) => (
                <EditionRow
                  key={edition.id}
                  edition={edition}
                  locale={locale}
                  uploading={uploading === edition.id}
                  deleting={deleting === edition.id}
                  onUpload={(file) => handleUpload(edition.id, file)}
                  onDelete={() => handleDelete(edition.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EditionRow({ edition, locale, uploading, deleting, onUpload, onDelete }) {
  const fileRef = useRef(null);
  const hasPdf = !!edition.pdf;
  const fileSizeKB = edition.pdf?.fileSize
    ? (edition.pdf.fileSize / 1024 / 1024).toFixed(1) + " MB"
    : "—";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-gray-500 text-sm font-mono">
        #{edition.number}
      </td>
      <td className="px-6 py-4">
        <span className="font-medium text-gray-900 text-sm">{edition.title}</span>
      </td>
      <td className="px-6 py-4">
        {hasPdf ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <FaCheck className="text-[10px]" /> PDF cargado
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
            <FaFilePdf className="text-[10px]" /> Sin PDF
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-gray-500 text-sm">{fileSizeKB}</td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {/* Botón ver — abre el mismo visor (PdfReader) que usan los
              suscriptores Digital-Abo, para corroborar que el PDF se vea bien */}
          {hasPdf && (
            <a
              href={`/${locale}/pdf-reader?url=${encodeURIComponent(edition.pdf.pdfUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              title="Vorschau — así lo ven die Digital-Abo Nutzer*innen"
            >
              <FaEye /> Ver
            </a>
          )}
          {/* Botón subir */}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || deleting}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: BRAND_RED }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_RED_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_RED)}
            title={hasPdf ? "Reemplazar PDF" : "Subir PDF"}
          >
            {uploading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload />
            )}
            {hasPdf ? "Reemplazar" : "Subir PDF"}
          </button>

          {/* Botón eliminar */}
          {hasPdf && (
            <button
              onClick={onDelete}
              disabled={uploading || deleting}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-lg transition-all disabled:opacity-50"
              title="Eliminar PDF"
            >
              {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
