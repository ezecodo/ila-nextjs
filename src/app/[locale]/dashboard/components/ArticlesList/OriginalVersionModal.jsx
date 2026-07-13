"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);
const InterviewEditor = dynamic(
  () => import("../../../components/InterviewEditor/InterviewEditor"),
  { ssr: false }
);

const LANGUAGE_PRESETS = [
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "other", label: "Otro…" },
];

export default function OriginalVersionModal({ articleId, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [languagePreset, setLanguagePreset] = useState("es");
  const [customLanguage, setCustomLanguage] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // { id, url, title, alt, originalTitle, originalAlt }
  const [inlineImageUrls, setInlineImageUrls] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        const data = await res.json();
        if (cancelled) return;

        const knownPreset = LANGUAGE_PRESETS.find(
          (p) => p.value === data.originalLanguage
        );
        if (data.originalLanguage && !knownPreset) {
          setLanguagePreset("other");
          setCustomLanguage(data.originalLanguage);
        } else if (knownPreset) {
          setLanguagePreset(knownPreset.value);
        }
        setTitle(data.originalTitle || "");
        setSubtitle(data.originalSubtitle || "");
        setPreviewText(data.originalPreviewText || "");
        setContent(data.originalContent || "");
        setImages(
          (data.images || []).map((img) => ({
            id: img.id,
            url: img.url,
            title: img.title || "",
            alt: img.alt || "",
            originalTitle: img.originalTitle || "",
            originalAlt: img.originalAlt || "",
          }))
        );
      } catch (err) {
        console.error("Error cargando artículo:", err);
        setMessage("❌ Error al cargar el artículo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const handleImageChange = (id, field, value) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const originalLanguage =
        languagePreset === "other" ? customLanguage.trim() : languagePreset;

      const originalImages = {};
      images.forEach((img) => {
        originalImages[img.id] = {
          originalTitle: img.originalTitle,
          originalAlt: img.originalAlt,
        };
      });

      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateOriginalVersion: true,
          originalLanguage: originalLanguage || null,
          originalTitle: title,
          originalSubtitle: subtitle || null,
          originalPreviewText: previewText || null,
          originalContent: content,
          originalImages,
          inlineImageUrls,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMessage("✅ Versión original guardada.");
        if (onSaved) onSaved(updated.originalLanguage);
        setTimeout(() => onClose(), 800);
      } else {
        setMessage("❌ Error al guardar.");
      }
    } catch (err) {
      console.error("Error guardando versión original:", err);
      setMessage("❌ Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            🌎 Versión original — Artículo #{articleId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Cargando…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Idioma original
              </label>
              <div className="flex gap-2">
                <select
                  value={languagePreset}
                  onChange={(e) => setLanguagePreset(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {LANGUAGE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {languagePreset === "other" && (
                  <input
                    type="text"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    placeholder="Nombre del idioma…"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Subtítulo (opcional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vorspann (opcional)
              </label>
              <QuillEditor value={previewText} onChange={setPreviewText} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contenido
              </label>
              <InterviewEditor
                value={content}
                onChange={setContent}
                onUrlInserted={(url) =>
                  setInlineImageUrls((prev) => [...prev, url])
                }
                title={title}
                subtitle={subtitle}
                articleId={articleId}
              />
            </div>

            {images.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  Créditos de imágenes en el idioma original
                </p>
                {images.map((img) => (
                  <div key={img.id} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3">
                    <img
                      src={img.url}
                      alt={img.title || "Imagen"}
                      className="w-16 h-16 object-cover rounded border shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={img.originalTitle}
                        onChange={(e) =>
                          handleImageChange(img.id, "originalTitle", e.target.value)
                        }
                        placeholder="Título/caption en el idioma original"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={img.originalAlt}
                        onChange={(e) =>
                          handleImageChange(img.id, "originalAlt", e.target.value)
                        }
                        placeholder="Descripción/créditos en el idioma original"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {message && <p className="text-sm">{message}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-[#BD0E0D] hover:bg-[#a50c0b] text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {saving ? "Guardando…" : "💾 Guardar versión original"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
