"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import InputField from "../NewArticle/InputField";
import styles from "../../../../styles/global.module.css";
import { useTranslations } from "next-intl";

// Visor del Dossier-PDF con recorte girable (pdfjs + canvas → solo cliente).
const PdfCropViewer = dynamic(
  () => import("../../PdfCropViewer/PdfCropViewer"),
  { ssr: false }
);

// Id local de las imágenes nuevas (aún sin guardar, sin `id` de la BD): lo
// usa el Publilab para ofrecerlas en su selector "insertar imagen en el texto"
// (prop availableImages de InterviewEditor). El guardado lo ignora.
let localIdSeq = 0;
const newLocalId = () => `new-${Date.now()}-${++localIdSeq}`;

// `dossierEditionId` / `dossierStartPage` / `dossierEndPage` (opcionales):
// si el formulario los pasa (editores de artículos), aparece el botón
// "📄 Aus Dossier-PDF ausschneiden" — abre el PDF del dossier en la página del
// artículo y cada recorte entra a la galería como un archivo más; se guarda
// con el botón normal del formulario. Sin esas props, el módulo queda igual
// que siempre (Aktuelles, eventos, etc.).
export default function ImageGalleryManager({
  gallery,
  setGallery,
  mode,
  dossierEditionId,
  dossierStartPage,
  dossierEndPage,
  // Opcional: avisa qué campo de una imagen ya agregada se enfocó
  // (index, "title" | "alt") — Artikel aus PDF lo usa como destino de "Textbereich".
  onFieldFocus,
}) {
  const t = useTranslations("galleryManager");

  // Modal "Aus Dossier-PDF": { status: "loading" | "ready" | "none", pdfUrl, added }
  const [dossierPdf, setDossierPdf] = useState(null);

  const openDossierPdf = async () => {
    setDossierPdf({ status: "loading", pdfUrl: null, added: 0 });
    try {
      const res = await fetch(`/api/editions/${dossierEditionId}/pdf-abo`);
      const data = res.ok ? await res.json() : null;
      setDossierPdf({
        status: data?.pdfUrl ? "ready" : "none",
        pdfUrl: data?.pdfUrl || null,
        added: 0,
      });
    } catch {
      setDossierPdf({ status: "none", pdfUrl: null, added: 0 });
    }
  };

  const addCroppedImage = (file) => {
    setGallery((prev) => [
      ...prev,
      { file, title: "", alt: "", isCover: false, order: prev.length + 1, _localId: newLocalId() },
    ]);
    setDossierPdf((d) => (d ? { ...d, added: d.added + 1 } : d));
  };

  // Campos temporales
  const [altText, setAltText] = useState("");
  const [descCredits, setDescCredits] = useState("");
  const [newImgFile, setNewImgFile] = useState(null);

  const handleReplaceCover = (file) => {
    setGallery([{ file, isCover: true }]);
  };

  const handleRemoveImage = (index) => {
    if (mode === "dossier") {
      setGallery([]);
    } else {
      // 🔥 Modo galería: eliminar solo esa imagen por índice
      setGallery((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // -------------------------------
  // 🔹 MODO "DOSSIER"
  // -------------------------------
  if (mode === "dossier") {
    const cover = gallery[0];
    const previewUrl = cover?.file
      ? URL.createObjectURL(cover.file)
      : cover?.url;

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t("coverLabel")}</label>

        {previewUrl ? (
          <div className="flex items-start gap-4">
            <img
              src={previewUrl}
              alt="Cover"
              className="w-32 h-44 object-cover rounded border"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() =>
                  document.getElementById("cover-file-input")?.click()
                }
              >
                {t("replaceImage")}
              </button>
              <button
                type="button"
                className="text-red-600 hover:underline"
                onClick={() => handleRemoveImage(0)}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        ) : (
          <input
            id="cover-file-input"
            type="file"
            accept="image/*"
            className={styles.input}
            onChange={(e) => {
              if (e.target.files?.[0]) handleReplaceCover(e.target.files[0]);
            }}
          />
        )}
      </div>
    );
  }

  // -------------------------------
  // 🔹 MODO GALERÍA (por defecto)
  // -------------------------------
  const handleAddImage = () => {
    if (!newImgFile) {
      alert(t("selectFileFirst"));
      return;
    }

    setGallery((prev) => [
      ...prev,
      {
        file: newImgFile,
        title: altText,
        alt: descCredits,
        isCover: false,
        order: prev.length + 1,
        _localId: newLocalId(),
      },
    ]);

    setNewImgFile(null);
    setAltText("");
    setDescCredits("");
    const inputEl = document.getElementById("gallery-file-input");
    if (inputEl) inputEl.value = "";
  };

  const handleEdit = (index, field, value) => {
    setGallery((prev) =>
      prev.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  };

  // Cómo se muestra esta imagen en el cuerpo del artículo (ausgaben/online) —
  // por defecto ("Auto") se detecta la orientación sola: horizontal se
  // recorta a 3:2, cuadrada/vertical se muestra completa. Acá se puede
  // forzar el modo cuando la automática no da el resultado que se quiere
  // (p. ej. una foto que igual se ve "enorme" con el tope automático de 80vh).
  const DISPLAY_MODES = [
    { value: "", label: t("displaySizeAuto") },
    { value: "cover", label: t("displaySizeCover") },
    { value: "contain-s", label: t("displaySizeContainS") },
    { value: "contain-m", label: t("displaySizeContainM") },
    { value: "contain-l", label: t("displaySizeContainL") },
  ];

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{t("sectionTitle")}</label>

      {/* Input archivo */}
      <input
        id="gallery-file-input"
        type="file"
        accept="image/*"
        onChange={(e) => setNewImgFile(e.target.files?.[0] || null)}
        className={styles.input}
      />

      {/* Alt-Text */}
      <InputField
        id="imgAltText"
        label={t("altTextLabel")}
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        placeholder={t("altTextPlaceholder")}
      />

      {/* Descripción / Créditos */}
      <InputField
        id="imgDescCredits"
        label={t("descriptionCreditsLabel")}
        value={descCredits}
        onChange={(e) => setDescCredits(e.target.value)}
        placeholder={t("descriptionCreditsPlaceholder")}
      />

      {/* Botón añadir */}
      <button
        type="button"
        className={styles.addAuthorButton}
        onClick={handleAddImage}
      >
        {t("addToGallery")}
      </button>

      {dossierEditionId && (
        <button
          type="button"
          onClick={openDossierPdf}
          className="mt-2 w-full px-3 py-2 text-sm border border-[#BD0E0D] text-[#BD0E0D] hover:bg-[#BD0E0D] hover:text-white transition-colors"
        >
          {t("fromDossierPdf")}
        </button>
      )}

      {/* Portal a body: el módulo vive dentro del <form> del editor y un
          ancestro con transform desubicaría el position:fixed. */}
      {dossierPdf && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 flex items-start justify-center p-4 overflow-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t("fromDossierPdfTitle")}
        >
          <div className="bg-white w-full max-w-[1100px] shadow-2xl border-t-4 border-[#BD0E0D]">
            <div className="sticky top-0 z-40 bg-white flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800">{t("fromDossierPdfTitle")}</h3>
                {dossierPdf.status === "ready" && (
                  <p className="text-xs text-gray-500">
                    {t("dossierPdfAdded", { count: dossierPdf.added })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDossierPdf(null)}
                className="shrink-0 px-4 py-1.5 text-sm font-semibold text-white bg-[#BD0E0D] hover:bg-[#a50c0b]"
              >
                {t("dossierPdfDone")}
              </button>
            </div>
            <div className="p-4 overflow-auto">
              {dossierPdf.status === "loading" && (
                <p className="text-sm text-gray-400">{t("loadingDossierPdf")}</p>
              )}
              {dossierPdf.status === "none" && (
                <p className="text-sm text-gray-600">{t("noDossierPdf")}</p>
              )}
              {dossierPdf.status === "ready" && (
                <PdfCropViewer
                  pdfUrl={dossierPdf.pdfUrl}
                  initialPage={dossierStartPage || 1}
                  rangeFrom={dossierStartPage}
                  rangeTo={dossierEndPage}
                  onImage={addCroppedImage}
                  defaultWidth={720}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview y edición */}
      {gallery.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">{t("addedImagesTitle")}</h4>
          <ul className="space-y-3">
            {gallery.map((img, index) => {
              const previewUrl = img.file
                ? URL.createObjectURL(img.file)
                : img.url;

              return (
                <li
                  key={index}
                  className="p-2 border rounded flex items-start gap-4"
                >
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={img.title || t("noAltText")}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}

                  <div className="flex-1 space-y-2">
                    <InputField
                      id={`altText-${index}`}
                      onFocus={() => onFieldFocus?.(index, "title")}
                      label={t("altTextLabel")}
                      value={img.title || ""}
                      onChange={(e) =>
                        handleEdit(index, "title", e.target.value)
                      }
                      placeholder={t("altTextPlaceholder")}
                    />
                    <InputField
                      id={`descCredits-${index}`}
                      onFocus={() => onFieldFocus?.(index, "alt")}
                      label={t("descriptionCreditsLabel")}
                      value={img.alt || ""}
                      onChange={(e) => handleEdit(index, "alt", e.target.value)}
                      placeholder={t("descriptionCreditsPlaceholder")}
                    />
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">
                        {t("displaySizeLabel")}
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {DISPLAY_MODES.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => handleEdit(index, "displayMode", m.value)}
                            className={`px-2 py-1 rounded text-xs border transition-colors ${
                              (img.displayMode || "") === m.value
                                ? "bg-[#BD0E0D] text-white border-[#BD0E0D]"
                                : "border-gray-300 text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-red-600 hover:underline ml-2"
                    onClick={() => handleRemoveImage(index)}
                  >
                    {t("delete")}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
