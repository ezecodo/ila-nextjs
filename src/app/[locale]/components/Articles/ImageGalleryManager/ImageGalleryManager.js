"use client";

import { useState } from "react";
import InputField from "../NewArticle/InputField";
import styles from "../../../../styles/global.module.css";
import { useTranslations } from "next-intl";

export default function ImageGalleryManager({ gallery, setGallery }) {
  const t = useTranslations("galleryManager");

  // Campos temporales para añadir nuevas imágenes
  const [altText, setAltText] = useState(""); // Alt-Text → DB.title
  const [descCredits, setDescCredits] = useState(""); // Descripción / Créditos → DB.alt
  const [newImgFile, setNewImgFile] = useState(null);
  const [newImgIsCover, setNewImgIsCover] = useState(false);

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
        isCover: newImgIsCover,
        order: prev.length + 1,
      },
    ]);

    // reset campos temporales
    setNewImgFile(null);
    setAltText("");
    setDescCredits("");
    setNewImgIsCover(false);

    // reset input file
    const inputEl = document.getElementById("gallery-file-input");
    if (inputEl) inputEl.value = "";
  };

  const handleRemoveImage = (index) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (index, field, value) => {
    setGallery((prev) =>
      prev.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  };

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

      {/* Alt-Text (accesibilidad) → DB.title */}
      <InputField
        id="imgAltText"
        label={t("altTextLabel")}
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        placeholder={t("altTextPlaceholder")}
      />

      {/* Descripción / Créditos → DB.alt */}
      <InputField
        id="imgDescCredits"
        label={t("descriptionCreditsLabel")}
        value={descCredits}
        onChange={(e) => setDescCredits(e.target.value)}
        placeholder={t("descriptionCreditsPlaceholder")}
      />

      {/* Checkbox portada */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="newImgIsCover"
          checked={newImgIsCover}
          onChange={(e) => setNewImgIsCover(e.target.checked)}
        />
        <label htmlFor="newImgIsCover">{t("useAsCover")}</label>
      </div>

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
                  {/* Preview */}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={img.title || t("noAltText")}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}

                  {/* Campos editables */}
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

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`isCover-${index}`}
                        checked={img.isCover || false}
                        onChange={(e) =>
                          handleEdit(index, "isCover", e.target.checked)
                        }
                      />
                      <label htmlFor={`isCover-${index}`}>
                        {t("useAsCover")}
                      </label>
                    </div>
                  </div>

                  {/* Botón eliminar */}
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
