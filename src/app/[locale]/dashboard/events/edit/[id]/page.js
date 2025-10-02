"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import EventForm from "../../EventForm";

export default function EditEventPage() {
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState(null);
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("events.dashboard");

  const eventId = params.id; // 👈 obtenemos el ID de la URL

  // 1️⃣ Cargar datos del evento
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error("Error al cargar evento");
        const data = await res.json();
        setEventData(data);
      } catch (err) {
        console.error("❌ Error cargando evento:", err);
      }
    }
    if (eventId) fetchEvent();
  }, [eventId]);

  // 2️⃣ Guardar cambios (PUT)
  const handleUpdate = async (data) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("❌ Error al actualizar evento");
      router.push("/dashboard/events");
    } catch (err) {
      console.error("❌ Error:", err);
      alert("No se pudo actualizar el evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-purple-700">
        {t("edit")} — {eventData?.title || ""}
      </h1>

      {eventData ? (
        <EventForm
          initialData={eventData}
          onSubmit={handleUpdate}
          loading={loading}
          isEdit={true}
        />
      ) : (
        <p>{t("loading") || "Cargando..."}</p>
      )}
    </div>
  );
}
