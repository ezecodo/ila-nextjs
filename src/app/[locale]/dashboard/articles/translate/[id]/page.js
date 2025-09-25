"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Copy } from "lucide-react";
function stripHtml(html) {
  if (!html) return "";
  // Sustituir <br> por salto de línea
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  // Sustituir </p> por doble salto de línea
  text = text.replace(/<\/p>/gi, "\n\n");
  // Eliminar todas las demás etiquetas
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.body.textContent || "";
}

const TranslateArticlePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [translations, setTranslations] = useState({
    titleES: "",
    subtitleES: "",
    previewES: "",
    contentES: "",
    additionalInfoES: "",
  });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [deepl, setDeepl] = useState(null); // { titleES, subtitleES, previewTextES, contentES, additionalInfoES }
  const [deeplLoading, setDeeplLoading] = useState(false);
  const [deeplError, setDeeplError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      const res = await fetch(`/api/articles/${id}`);
      const data = await res.json();
      setArticle(data);
      setTranslations({
        titleES: data.titleES || "",
        subtitleES: data.subtitleES || "",
        previewES: data.previewTextES || "",
        contentES: data.contentES || "",
        additionalInfoES: data.additionalInfoES || "",
      });
    };
    fetchArticle();
  }, [id]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsReviewMode(params.get("mode") === "review");
  }, []);

  const handleChange = (e) => {
    setTranslations({
      ...translations,
      [e.target.name]: e.target.value,
    });
  };

  if (!article) {
    return <div className="p-6 text-gray-600">⏳ Cargando artículo...</div>;
  }
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("📋 Copiado al portapapeles:", text);
    });
  };
  // Llama a tu endpoint backend y cachea el resultado en estado
  const fetchDeepl = async () => {
    if (deepl) return deepl; // ya cargado
    try {
      setDeeplLoading(true);
      setDeeplError("");
      const res = await fetch("/api/translate/deepl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json(); // { translations: {...} }
      setDeepl(data.translations);
      return data.translations;
    } catch (e) {
      setDeeplError(e.message || "DeepL error");
      alert(`❌ DeepL: ${e.message || "Error desconocido"}`);
      return null;
    } finally {
      setDeeplLoading(false);
    }
  };

  // Rellena TODO el formulario con lo de DeepL (solo vacíos, no pisa lo escrito)
  const fillAllFromDeepl = async () => {
    const tr = await fetchDeepl();
    if (!tr) return;
    setTranslations((prev) => ({
      ...prev,
      titleES: prev.titleES || tr.titleES || "",
      subtitleES: prev.subtitleES || tr.subtitleES || "",
      // ojo: tu state usa previewES; el backend devuelve previewTextES
      previewES: prev.previewES || stripHtml(tr.previewTextES) || "",
      contentES: prev.contentES || stripHtml(tr.contentES) || "",
      additionalInfoES:
        prev.additionalInfoES || stripHtml(tr.additionalInfoES) || "",
    }));
  };

  // Rellena solo un campo concreto (opcionalmente forzar pisado)
  const fillFieldFromDeepl = async (
    stateKey,
    deeplKey,
    { force = false } = {}
  ) => {
    const tr = await fetchDeepl();
    if (!tr) return;
    setTranslations((prev) => {
      if (!force && prev[stateKey]) return prev; // no pisar si ya hay texto
      return { ...prev, [stateKey]: stripHtml(tr[deeplKey]) || "" };
    });
  };

  return (
    <div className="translate-page max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">
        🌐 Traducir artículo al español
      </h1>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={fillAllFromDeepl}
          disabled={deeplLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          title="Autotraducir todos los campos (no pisa lo ya escrito)"
        >
          ⚡ Autotraducir con DeepL
        </button>

        {deeplError && (
          <span className="text-red-600 text-sm">DeepL: {deeplError}</span>
        )}
      </div>
      <form className="grid grid-cols-2 gap-6 text-sm">
        {/* Título */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.title)}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Título (alemán)</label>
          </div>
          <p className="field-readonly mt-1">{article.title}</p>
        </div>
        <div>
          <label className="font-bold">Título (español)</label>
          <div className="flex gap-2">
            <input
              name="titleES"
              value={translations.titleES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  titleES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("titleES", "titleES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>
        {/* Subtítulo */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.subtitle || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Subtítulo (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.subtitle) || "—"}
          </p>
        </div>

        <div>
          <label className="font-bold">Subtítulo (español)</label>
          <div className="flex gap-2">
            <input
              name="subtitleES"
              value={translations.subtitleES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  subtitleES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("subtitleES", "subtitleES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.previewText || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Preview Text (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.previewText) || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Preview Text (español)</label>
          <div className="flex gap-2">
            <textarea
              name="previewES"
              value={translations.previewES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded h-24 flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  previewES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("previewES", "previewTextES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.content || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Contenido (alemán)</label>
          </div>
          <p className="field-readonly h-48 overflow-y-scroll mt-1">
            {stripHtml(article.content) || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Contenido (español)</label>
          <div className="flex gap-2">
            <textarea
              name="contentES"
              value={translations.contentES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded h-48 flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  contentES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("contentES", "contentES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.additionalInfo || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Información adicional (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.additionalInfo) || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Información adicional (español)</label>
          <div className="flex gap-2">
            <textarea
              name="additionalInfoES"
              value={translations.additionalInfoES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded h-24 flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  additionalInfoES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() =>
                fillFieldFromDeepl("additionalInfoES", "additionalInfoES")
              }
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="col-span-2 flex justify-end mt-4">
          {isReviewMode ? (
            <button
              type="button"
              onClick={async () => {
                const confirm = window.confirm(
                  "¿Estás seguro de aprobar esta traducción?"
                );
                if (!confirm) return;

                const res = await fetch(`/api/articles/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...translations,
                    translationStatus: "approved",
                  }),
                });

                if (res.ok) {
                  await fetch("/api/activity-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      articleId: id,
                      action: "REVIEW_TRANSLATION",
                    }),
                  });

                  alert("✅ Traducción revisada y aprobada");
                  router.replace("/dashboard/articles?mode=reviewer");
                } else {
                  alert("❌ Error al aprobar la traducción");
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              ✅ Aprobar traducción
            </button>
          ) : (
            <div className="flex gap-3">
              {/* Guardar borrador */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...translations,
                      translationStatus: "in_progress",
                    }),
                  });

                  if (res.ok) {
                    alert("💾 Traducción guardada como borrador");
                  } else {
                    alert("❌ Error al guardar borrador");
                  }
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                💾 Guardar borrador
              </button>

              {/* Enviar traducción */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...translations,
                      translationStatus: "submitted",
                    }),
                  });

                  if (res.ok) {
                    alert("📤 Traducción enviada para revisión");
                    router.replace("/dashboard/translators/assignments");
                  } else {
                    alert("❌ Error al enviar traducción");
                  }
                }}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                📤 Enviar traducción
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TranslateArticlePage;
