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
    setGallery([{ file, isCover: true }]); // 🔥 sobrescribe con una sola imagen
  };

  const handleRemoveImage = () => {
    setGallery([]); // 🔥 quita la portada
  };

  // -------------------------------
  // 🔹 MODO "DOSSIER"
  // -------------------------------
  if (mode === "dossier") {
    const cover = gallery[0]; // solo esperamos 1 imagen
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
                onClick={handleRemoveImage}
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
