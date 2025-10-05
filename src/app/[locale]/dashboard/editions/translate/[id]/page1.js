"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import EditableField from "../../../components/EditableField/EditableField";

export default function TranslateEditionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [edition, setEdition] = useState(null);
  const [translations, setTranslations] = useState({
    titleES: "",
    subtitleES: "",
    summaryES: "",
    tableOfContentsES: "",
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar edición
  useEffect(() => {
    const fetchEdition = async () => {
      const res = await fetch(`/api/editions/${id}`);
      const data = await res.json();
      setEdition(data);

      // Cargar traducciones existentes
      setTranslations({
        titleES: data.titleES || "",
        subtitleES: data.subtitleES || "",
        summaryES: data.summaryES || "",
        tableOfContentsES: data.tableOfContentsES || "",
      });
    };

    if (id) {
      fetchEdition();
    }
  }, [id]);

  // Autoguardado cada 30 segundos
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveAsDraft();
    }, 30000);

    return () => clearTimeout(timer);
  }, [translations, hasUnsavedChanges]);

  // Calcular progreso
  const calculateProgress = () => {
    const fields = ["titleES", "summaryES", "tableOfContentsES"];
    const completed = fields.filter(
      (field) => translations[field] && translations[field].trim().length > 0
    ).length;
    return { completed, total: fields.length };
  };

  const progress = calculateProgress();

  // Manejar cambios
  const handleChange = (field, value) => {
    setTranslations((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Guardar como borrador
  const saveAsDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/editions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...translations,
          isTranslatedES: false, // Aún no está completo
        }),
      });

      if (res.ok) {
        setLastSaved(Date.now());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Enviar traducción completa
  const submitTranslation = async () => {
    // Validar campos obligatorios
    if (!translations.titleES || !translations.summaryES) {
      alert("⚠️ Faltan campos obligatorios: Título y Resumen");
      return;
    }

    const confirm = window.confirm(
      "¿Estás seguro de enviar esta traducción? Se marcará como completa."
    );

    if (!confirm) return;

    try {
      const res = await fetch(`/api/editions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...translations,
          isTranslatedES: true,
        }),
      });

      if (res.ok) {
        alert("✅ Traducción enviada correctamente");
        router.push("/dashboard/editions");
      } else {
        alert("❌ Error al enviar la traducción");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al enviar la traducción");
    }
  };

  // Formato del timestamp de guardado
  const getLastSavedText = () => {
    if (!lastSaved) return "Sin guardar";
    const seconds = Math.floor((Date.now() - lastSaved) / 1000);
    if (seconds < 60) return `Guardado hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `Guardado hace ${minutes}m`;
  };

  if (!edition) {
    return <div className="p-6 text-gray-600">⏳ Cargando edición...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header de traducción */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 p-6 rounded-lg mb-8 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              🌐 Traduciendo: ila {edition.number}
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {edition.title}
            </p>
          </div>
          <button
            onClick={submitTranslation}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all"
          >
            📤 Enviar traducción
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300">
                Progreso: {progress.completed}/{progress.total} campos
              </span>
              <span
                className={`${isSaving ? "text-blue-600" : "text-gray-600"} dark:text-gray-400`}
              >
                {isSaving ? "💾 Guardando..." : getLastSavedText()}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${(progress.completed / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <button
            onClick={saveAsDraft}
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            💾 Guardar ahora
          </button>
        </div>
      </div>

      {/* Layout similar a EditionDetails */}
      <div className="mb-8">
        {/* Imagen y metadatos a la izquierda */}
        <div className="float-left mr-6 mb-4 w-full md:w-1/3">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={400}
            height={550}
            className="rounded shadow-md w-full max-w-xs"
          />

          {/* Badges de regiones */}
          <div className="mt-4">
            {edition.regions?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {edition.regions.map((region) => (
                  <span
                    key={region.id}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold"
                  >
                    {region.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Badges de topics */}
          <div className="mt-2">
            {edition.topics?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {edition.topics.map((topic) => (
                  <span
                    key={topic.id}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold"
                  >
                    {topic.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Campos de traducción a la derecha */}
        <div className="overflow-hidden">
          {/* Título */}
          <EditableField
            label="Título"
            original={edition.title}
            value={translations.titleES}
            onChange={(val) => handleChange("titleES", val)}
            className="text-3xl font-serif font-bold text-red-800 dark:text-red-400"
            placeholder="Traducir el título del dossier"
          />

          {/* Subtítulo */}
          {edition.subtitle && (
            <EditableField
              label="Subtítulo"
              original={edition.subtitle}
              value={translations.subtitleES}
              onChange={(val) => handleChange("subtitleES", val)}
              className="text-xl text-gray-700 dark:text-gray-300"
              placeholder="Traducir el subtítulo"
            />
          )}

          {/* Fecha de publicación (no editable) */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Publicado:{" "}
            {new Date(edition.datePublished).toLocaleDateString("es", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {/* Resumen */}
          <EditableField
            label="Resumen"
            original={edition.summary}
            value={translations.summaryES}
            onChange={(val) => handleChange("summaryES", val)}
            multiline={true}
            rows={10}
            className="text-lg font-serif leading-relaxed text-gray-800 dark:text-gray-200"
            placeholder="Traducir el resumen completo del dossier"
          />
        </div>

        <div className="clear-both"></div>
      </div>

      {/* Tabla de contenidos */}
      {edition.tableOfContents && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📑 Tabla de contenidos
          </h2>

          <EditableField
            label="Tabla de contenidos"
            original={edition.tableOfContents}
            value={translations.tableOfContentsES}
            onChange={(val) => handleChange("tableOfContentsES", val)}
            multiline={true}
            rows={15}
            className="text-sm font-mono"
            placeholder="Traducir la tabla de contenidos completa"
          />
        </div>
      )}

      {/* Botones finales */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold"
        >
          ← Volver
        </button>
        <button
          onClick={saveAsDraft}
          disabled={isSaving || !hasUnsavedChanges}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          💾 Guardar borrador
        </button>
        <button
          onClick={submitTranslation}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md"
        >
          📤 Enviar traducción completa
        </button>
      </div>
    </div>
  );
}
