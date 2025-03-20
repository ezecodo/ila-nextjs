"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link"; // ✅ Importamos Link para navegación
import Calendar from "../../components/Calendar/Calendar";

export default function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Error al cargar eventos");
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Eventos</h1>

      {/* ✅ Insertamos el calendario arriba de la lista de eventos */}
      <Calendar events={events} />

      {events.length === 0 ? (
        <p>No hay eventos disponibles.</p>
      ) : (
        <ul className="space-y-6">
          {events.map((event) => (
            <li key={event.id} className="border p-4 rounded-lg shadow-md">
              <Link
                href={`/events/${event.id}`}
                className="block hover:opacity-80"
              >
                {/* ✅ Imagen optimizada con next/image */}
                {event.image && (
                  <div className="relative w-full h-40">
                    <Image
                      src={event.image}
                      alt={event.title || "Imagen del evento"}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                )}

                <h2 className="text-xl font-semibold mt-4">{event.title}</h2>
                <p className="text-gray-600">
                  {new Date(event.date).toLocaleDateString()}
                </p>
                <p className="mt-2">{event.description}</p>
                <p className="mt-2 font-semibold">
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
