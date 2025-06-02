"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Copy } from "lucide-react";

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

  const handleChange = (e) => {
    setTranslations({
      ...translations,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Paso 1: Guardar la traducción
    const res = await fetch(`/api/articles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...translations }),
    });

    if (res.ok) {
      // Paso 2: Registrar la actividad (log)
      await fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: id,
          action: "TRANSLATE_ARTICLE",
        }),
      });

      // Paso 3: Confirmar y redirigir
      alert("✅ Traducción guardada");
      router.push("/dashboard/articles");
    } else {
      alert("❌ Error al guardar");
    }
  };
  if (!article) {
    return <div className="p-6 text-gray-600">⏳ Cargando artículo...</div>;
  }
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("📋 Copiado al portapapeles:", text);
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">
        🌐 Traducir artículo al español
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 text-sm">
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
          <p className="border bg-gray-100 p-2 rounded mt-1">{article.title}</p>
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
                setTranslations((prev) => ({ ...prev, titleES: text }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
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
          <p className="border bg-gray-100 p-2 rounded mt-1">
            {article.subtitle || "—"}
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
                setTranslations((prev) => ({ ...prev, subtitleES: text }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
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
          <p className="border bg-gray-100 p-2 rounded whitespace-pre-line mt-1">
            {article.previewText || "—"}
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
                setTranslations((prev) => ({ ...prev, previewES: text }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
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
          <p className="border bg-gray-100 p-2 rounded whitespace-pre-line h-48 overflow-y-scroll mt-1">
            {article.content}
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
                setTranslations((prev) => ({ ...prev, contentES: text }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
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
          <p className="border bg-gray-100 p-2 rounded whitespace-pre-line mt-1">
            {article.additionalInfo || "—"}
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
                  additionalInfoES: text,
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="col-span-2 flex justify-end mt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            💾 Guardar traducción
          </button>
        </div>
      </form>
    </div>
  );
};

export default TranslateArticlePage;
