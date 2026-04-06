"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AktuellesForm from "../../AktuellesForm";

export default function EditAktuellesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [aktuelles, setAktuelles] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch del aktuelles al montar
  useEffect(() => {
    const fetchAktuelles = async () => {
      try {
        const res = await fetch(`/api/aktuelles/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el Aktuelles");
        const data = await res.json();
        setAktuelles(data);
      } catch (err) {
        console.error("❌ Error cargando Aktuelles:", err);
      }
    };

    if (id) fetchAktuelles();
  }, [id]);

  const handleUpdate = async (data, aktuellesId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/aktuelles/${aktuellesId}`, {
        method: "PUT",
        body: data, // FormData — no Content-Type header needed
      });

      // 🔍 Ver el error real del servidor
      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || "Error actualizando Aktuelles");
      }

      router.push("/dashboard/aktuelles");
    } catch (err) {
      console.error("❌ Error actualizando:", err);
      alert(`No se pudo actualizar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!aktuelles) {
    return <p className="p-6">⏳ Cargando Aktuelles...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-purple-700">
        Aktuelles bearbeiten
      </h1>

      <AktuellesForm
        initialData={aktuelles}
        onSubmit={(data) => handleUpdate(data, Number(id))}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
