"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function EditEventPage() {
  const { id } = useParams();
  const router = useRouter();

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    image: null,
  });

  const [originalImage, setOriginalImage] = useState(""); // 🔁 Para mantener imagen existente
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Obtener datos del evento existente
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();
        setEventData({
          title: data.title,
          description: data.description,
          date: data.date.split("T")[0], // para input tipo date
          location: data.location,
          image: null,
        });
        setOriginalImage(data.image); // guardamos URL
      } catch (err) {
        console.error("Error cargando evento:", err);
        setMessage("❌ Error al cargar el evento");
      }
    };

    if (id) fetchEvent();
  }, [id]);

  // 🔹 Vista previa de imagen si se selecciona una nueva
  useEffect(() => {
    if (!eventData.image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(eventData.image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [eventData.image]);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setEventData({ ...eventData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", eventData.title);
      formData.append("description", eventData.description);
      formData.append("date", eventData.date);
      formData.append("location", eventData.location);
      if (eventData.image) {
        formData.append("image", eventData.image);
      }

      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al actualizar evento");

      setMessage("✅ Evento actualizado correctamente");
      setTimeout(() => router.push("/dashboard"), 1500); // Opcional: redirigir
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al actualizar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Editar Evento</h1>

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

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />

        {/* Vista previa */}
        {preview ? (
          <div className="relative w-full h-40 mt-4">
            <Image
              src={preview}
              alt="Vista previa"
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>
        ) : originalImage ? (
          <div className="relative w-full h-40 mt-4">
            <Image
              src={originalImage}
              alt="Imagen original"
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
