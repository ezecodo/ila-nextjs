"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCarouselPage() {
  const { id } = useParams();
  const router = useRouter();

  const [carousel, setCarousel] = useState(null);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    fetch(`/api/carousels/${id}`)
      .then((res) => res.json())
      .then(setCarousel);

    fetch("/api/beitragstyp")
      .then((res) => res.json())
      .then(setTypes);
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(carousel),
    });

    if (res.ok) {
      router.push("/dashboard/carousels");
    } else {
      alert("Error al guardar");
    }
  };

  if (!carousel) return <p>Cargando...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Editar carrusel</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={carousel.name}
          onChange={(e) => setCarousel({ ...carousel, name: e.target.value })}
        />
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={carousel.titleES}
          onChange={(e) =>
            setCarousel({ ...carousel, titleES: e.target.value })
          }
        />
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={carousel.titleDE}
          onChange={(e) =>
            setCarousel({ ...carousel, titleDE: e.target.value })
          }
        />
        <select
          className="w-full border p-2 rounded"
          value={carousel.beitragstypId}
          onChange={(e) =>
            setCarousel({ ...carousel, beitragstypId: e.target.value })
          }
        >
          <option value="">Seleccionar tipo de contenido</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.nameES}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="w-full border p-2 rounded"
          value={carousel.limit}
          onChange={(e) =>
            setCarousel({ ...carousel, limit: Number(e.target.value) })
          }
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
