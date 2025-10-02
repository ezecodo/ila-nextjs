"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import EventForm from "../EventForm";
import { useTranslations } from "next-intl";

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("events.dashboard");

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      if (document.activeElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async (data) => {
    try {
      setLoading(true);

      // 🔹 Validar que haya imagen
      if (!data.images || data.images.length === 0) {
        alert("Por favor selecciona una imagen");
        setLoading(false);
        return;
      }

      const firstImage = data.images[0];

      // 🔹 Convertir dataURL a File si es necesario
      let imageFile = firstImage.file;
      if (!imageFile && firstImage.fileDataUrl) {
        // Convertir base64 a blob
        const res = await fetch(firstImage.fileDataUrl);
        const blob = await res.blob();
        imageFile = new File([blob], "event-image.jpg", { type: "image/jpeg" });
      }

      if (!imageFile) {
        alert("Error al procesar la imagen");
        setLoading(false);
        return;
      }

      // 🔹 Crear FormData
      const formData = new FormData();
      formData.append("title", data.title || "");
      formData.append("titleES", data.titleES || "");
      formData.append("description", data.description || "");
      formData.append("descriptionES", data.descriptionES || "");
      formData.append("date", data.date || "");
      formData.append("time", data.time || "");
      formData.append("location", data.location || "");
      formData.append("image", imageFile);

      const res = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear evento");
      }

      router.push("/dashboard/events");
    } catch (err) {
      console.error("❌ Error:", err);
      alert(err.message || "No se pudo crear el evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-purple-700">
        {t("newEvent")}
      </h1>

      <EventForm onSubmit={handleCreate} loading={loading} isEdit={false} />
    </div>
  );
}
