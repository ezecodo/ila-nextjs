"use client";

import React, { useState } from "react";

const ImageUploader = ({ onImageSelect }) => {
  const [preview, setPreview] = useState(null); // Vista previa de la imagen

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file)); // Generar la vista previa
      onImageSelect(file); // Pasar el archivo seleccionado al componente padre
    }
  };

  return (
    <div className="image-uploader">
      <label
        htmlFor="imageUpload"
        className="block text-sm font-medium text-gray-700"
      >
        Subir Imagen del Artículo
      </label>
      <input
        id="imageUpload"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
      />
      {preview && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Vista previa"
            className="rounded shadow w-40 h-40 object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
