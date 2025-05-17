"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const TranslateArticlePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [translations, setTranslations] = useState({
    titleES: "",
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
    const res = await fetch(`/api/articles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...translations }),
    });

    if (res.ok) {
      alert("✅ Traducción guardada");
      router.push("/dashboard/articles");
    } else {
      alert("❌ Error al guardar");
    }
  };

  if (!article) return <div className="p-4">Cargando artículo...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">
        🌐 Traducir artículo al español
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 text-sm">
        {/* Título */}
        <div>
          <label className="font-bold">Título (alemán)</label>
          <p className="border bg-gray-100 p-2 rounded">{article.title}</p>
        </div>
        <div>
          <label className="font-bold">Título (español)</label>
          <input
            name="titleES"
            value={translations.titleES}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Preview */}
        <div>
          <label className="font-bold">Preview Text (alemán)</label>
          <p className="border bg-gray-100 p-2 rounded whitespace-pre-line">
            {article.previewText || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Preview Text (español)</label>
          <textarea
            name="previewES"
            value={translations.previewES}
            onChange={handleChange}
            className="border p-2 w-full rounded h-24"
          />
        </div>

        {/* Contenido */}
        <div>
          <label className="font-bold">Contenido (alemán)</label>
          <p className="border bg-gray-100 p-2 rounded whitespace-pre-line h-48 overflow-y-scroll">
            {article.content}
          </p>
        </div>
        <div>
          <label className="font-bold">Contenido (español)</label>
          <textarea
            name="contentES"
            value={translations.contentES}
            onChange={handleChange}
            className="border p-2 w-full rounded h-48"
          />
        </div>

        {/* Información adicional */}
        <div>
          <label className="font-bold">Información adicional (alemán)</label>
          <p className="border bg-gray-100 p-2 rounded whitespace-pre-line">
            {article.additionalInfo || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Información adicional (español)</label>
          <textarea
            name="additionalInfoES"
            value={translations.additionalInfoES}
            onChange={handleChange}
            className="border p-2 w-full rounded h-24"
          />
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
