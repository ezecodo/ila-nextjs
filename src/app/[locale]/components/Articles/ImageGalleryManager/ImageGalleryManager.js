"use client";

import { useState } from "react";
import InputField from "../NewArticle/InputField";
import styles from "../../../../styles/global.module.css";

export default function ImageGalleryManager({ gallery, setGallery }) {
  const [newImgFile, setNewImgFile] = useState(null);
  const [newImgTitle, setNewImgTitle] = useState("");
  const [newImgAlt, setNewImgAlt] = useState("");
  const [newImgIsCover, setNewImgIsCover] = useState(false);

  const handleAddImage = () => {
    if (!newImgFile) {
      alert("Selecciona un archivo de imagen primero");
      return;
    }

    setGallery((prev) => [
      ...prev,
      {
        file: newImgFile,
        title: newImgTitle,
        alt: newImgAlt,
        isCover: newImgIsCover,
        order: prev.length + 1,
      },
    ]);

    // limpiar formulario temporal
    setNewImgFile(null);
    setNewImgTitle("");
    setNewImgAlt("");
    setNewImgIsCover(false);
  };

  const handleRemoveImage = (index) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>Galería de imágenes</label>

      {/* Input para archivo */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setNewImgFile(e.target.files[0])}
        className={styles.input}
      />

      {/* Campos de título y alt */}
      <InputField
        id="newImgTitle"
        label="Título de la imagen"
        value={newImgTitle}
        onChange={(e) => setNewImgTitle(e.target.value)}
        placeholder="Ej: Protesta en Buenos Aires"
      />
      <InputField
        id="newImgAlt"
        label="Texto alternativo / créditos"
        value={newImgAlt}
        onChange={(e) => setNewImgAlt(e.target.value)}
        placeholder="Ej: Foto: Juan Pérez"
      />

      {/* Checkbox para marcar como portada */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="newImgIsCover"
          checked={newImgIsCover}
          onChange={(e) => setNewImgIsCover(e.target.checked)}
        />
        <label htmlFor="newImgIsCover">Usar como portada</label>
      </div>

      {/* Botón para añadir la imagen */}
      <button
        type="button"
        className={styles.addAuthorButton}
        onClick={handleAddImage}
      >
        Añadir a galería
      </button>

      {/* Preview de la galería */}
      {gallery.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Imágenes añadidas</h4>
          <ul className="space-y-3">
            {gallery.map((img, index) => {
              const previewUrl = img.file
                ? URL.createObjectURL(img.file) // imágenes recién añadidas
                : img.url; // imágenes cargadas desde la BD

              return (
                <li
                  key={index}
                  className="p-2 border rounded flex items-center gap-4"
                >
                  {/* Preview */}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={img.alt || "preview"}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium">{img.title || "Sin título"}</p>
                    <p className="text-sm text-gray-500">
                      {img.alt || "Sin créditos"}
                    </p>
                    {img.isCover && (
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        Portada
                      </span>
                    )}
                  </div>

                  {/* Botón eliminar */}
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => handleRemoveImage(index)}
                  >
                    Eliminar
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
