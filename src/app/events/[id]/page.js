"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function EventPage() {
  const { id } = useParams(); // ✅ Obtener el ID desde la URL
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return; // Evitar ejecución si no hay ID

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Error desconocido");
        }

        setEvent(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Cargando evento...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-500">❌ {error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/events" className="text-blue-500 mb-4 inline-block">
        ← Volver a eventos
      </Link>

      {/* Imagen del evento */}
      {event.image && (
        <div className="relative w-full h-60 mb-6">
          <Image
            src={event.image}
            alt={event.title || "Imagen del evento"}
            layout="fill"
            objectFit="cover"
            className="rounded-md"
          />
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="text-gray-600 text-lg">
        📅 {new Date(event.date).toLocaleDateString()}
      </p>
      <p className="mt-2 text-gray-800">{event.description}</p>
      <p className="mt-4 font-semibold text-gray-900">
        📍{" "}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            event.location
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {event.location}
        </a>
      </p>
    </div>
  );
}
