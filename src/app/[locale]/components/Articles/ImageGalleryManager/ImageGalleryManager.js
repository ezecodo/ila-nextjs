"use client";

import { useState } from "react";
import InputField from "../NewArticle/InputField";
import styles from "../../../../styles/global.module.css";
import { useTranslations } from "next-intl";

export default function ImageGalleryManager({ gallery, setGallery, mode }) {
  const t = useTranslations("galleryManager");

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
                      label={t("altTextLabel")}
                      value={img.title || ""}
                      onChange={(e) =>
                        handleEdit(index, "title", e.target.value)
                      }
                      placeholder={t("altTextPlaceholder")}
                    />
                    <InputField
                      id={`descCredits-${index}`}
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
