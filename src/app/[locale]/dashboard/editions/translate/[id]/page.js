"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import EditableField from "../../../components/EditableField/EditableField";

export default function TranslateEditionPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("editionTranslate");

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
          isTranslatedES: false,
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
    if (!translations.titleES || !translations.summaryES) {
      alert(t("missingFields"));
      return;
    }

    const confirm = window.confirm(t("confirmSubmit"));

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
        alert(t("submitSuccess"));
        router.push("/dashboard/editions");
      } else {
        alert(t("submitError"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t("submitError"));
    }
  };

  const getLastSavedText = () => {
    if (!lastSaved) return t("notSaved");
    const seconds = Math.floor((Date.now() - lastSaved) / 1000);
    if (seconds < 60) return t("savedAgo", { time: `${seconds}s` });
    const minutes = Math.floor(seconds / 60);
    return t("savedAgo", { time: `${minutes}m` });
  };

  if (!edition) {
    return <div className="p-6 text-gray-600">⏳ Cargando edición...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Barra de traducción flotante */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-bold text-lg">{t("translationMode")}</h2>
              <p className="text-sm text-blue-100">
                {isSaving ? t("saving") : getLastSavedText()} |{" "}
                {t("progress", {
                  completed: progress.completed,
                  total: progress.total,
                })}
              </p>
            </div>
            <div className="w-32 bg-blue-800 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(progress.completed / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveAsDraft}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 {t("saveNow")}
            </button>
            <button
              onClick={submitTranslation}
              className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600"
            >
              📤 {t("submitTranslation")}
            </button>
          </div>
        </div>
      </div>

      {/* Diseño idéntico a EditionDetails */}
      <div className="mb-8">
        {/* Imagen flotante a la izquierda */}
        <div className="float-left mr-6 mb-4 w-full md:w-1/3">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={400}
            height={550}
            className="rounded shadow-md w-full max-w-xs"
          />

          {/* Badges de regiones */}
          <div className="badgesContainer mt-2">
            {edition.regions?.length > 0 ? (
              edition.regions.map((region) => (
                <span key={region.id} className="regionBadge">
                  {region.name}
                </span>
              ))
            ) : (
              <span className="regionBadge">Sin regiones asociadas</span>
            )}
          </div>

          {/* Badges de topics */}
          <div className="badgesContainer mt-2">
            {edition.topics?.length > 0 ? (
              edition.topics.map((topic) => (
                <span key={topic.id} className="topicBadge">
                  {topic.name}
                </span>
              ))
            ) : (
              <span className="topicBadge">Sin tópicos asociados</span>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="overflow-hidden">
          {/* Título editable con el mismo estilo */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-4xl mb-2 leading-snug">
              <span
                className="font-bold text-gray-800 dark:text-gray-200"
                style={{ fontFamily: "Futura" }}
              >
                ila {edition.number}
              </span>{" "}
              <span className="text-sm text-gray-500 dark:text-gray-400 block md:inline">
                ({t("original")}: {edition.title})
              </span>
            </h1>

            <EditableField
              label={t("titleLabel")}
              original={edition.title}
              value={translations.titleES}
              onChange={(val) => handleChange("titleES", val)}
              className="text-2xl md:text-3xl font-serif font-bold text-red-800 dark:text-red-400"
              placeholder={t("titleLabel")}
            />
          </div>

          {/* Subtítulo si existe */}
          {edition.subtitle && (
            <div className="mb-4">
              <EditableField
                label={t("subtitleLabel")}
                original={edition.subtitle}
                value={translations.subtitleES}
                onChange={(val) => handleChange("subtitleES", val)}
                className="text-xl text-gray-700 dark:text-gray-300"
                placeholder={t("subtitleLabel")}
              />
            </div>
          )}

          {/* Fecha de publicación (no editable) */}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t("publishedOn")}:{" "}
            {new Date(edition.datePublished).toLocaleDateString("es", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Resumen editable con el mismo estilo de article-content */}
        <div className="article-content font-serif text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200">
          <EditableField
            label={t("summaryLabel")}
            original={edition.summary}
            value={translations.summaryES}
            onChange={(val) => handleChange("summaryES", val)}
            multiline={true}
            rows={10}
            className="font-serif text-lg md:text-xl leading-relaxed"
            placeholder={t("summaryLabel")}
          />
        </div>

        <div className="clear-both"></div>
      </div>

      {/* Tabla de contenidos editable */}
      {edition.tableOfContents && (
        <div className="my-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("tableOfContentsLabel")}
            </h2>
          </div>

          <EditableField
            label={t("tableOfContentsLabel")}
            original={edition.tableOfContents}
            value={translations.tableOfContentsES}
            onChange={(val) => handleChange("tableOfContentsES", val)}
            multiline={true}
            rows={15}
            className="text-sm font-mono whitespace-pre-wrap"
            placeholder={t("tableOfContentsLabel")}
          />
        </div>
      )}

      {/* Botones finales */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold"
        >
          ← {t("back")}
        </button>
        <button
          onClick={saveAsDraft}
          disabled={isSaving || !hasUnsavedChanges}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          💾 {t("saveDraft")}
        </button>
        <button
          onClick={submitTranslation}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md"
        >
          📤 {t("submitTranslation")}
        </button>
      </div>
    </div>
  );
}
