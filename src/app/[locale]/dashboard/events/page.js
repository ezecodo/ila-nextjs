"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; // ✅ Importar el componente de Next.js

export default function CreateEventPage() {
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    image: null, // Se cambiará con la imagen seleccionada
  });

  const [preview, setPreview] = useState(null); // Para la vista previa de la imagen
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!eventData.image) return;
    const objectUrl = URL.createObjectURL(eventData.image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl); // Limpiar memoria al cambiar imagen
  }, [eventData.image]);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setEventData({ ...eventData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", eventData.title);
      formData.append("description", eventData.description);
      formData.append("date", eventData.date);
      formData.append("location", eventData.location);
      formData.append("image", eventData.image);

      const res = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al agregar evento");

      setMessage("✅ Evento agregado correctamente");
      setEventData({
        title: "",
        description: "",
        date: "",
        location: "",
        image: null,
      });
      setPreview(null); // Limpiar vista previa
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al agregar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Agregar Nuevo Evento</h1>

      {message && <p className="mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Título del evento"
          value={eventData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Descripción del evento"
          value={eventData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="date"
          name="date"
          value={eventData.date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="location"
          placeholder="Ubicación del evento"
          value={eventData.location}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        {/* Input para subir imagen */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
          required
        />

        {/* ✅ Mostrar vista previa con next/image */}
        {preview && (
          <div className="relative w-full h-40 mt-4">
            <Image
              src={preview}
              alt="Vista previa del flyer"
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Agregar Evento"}
        </button>
      </form>
    </div>
  );
}
