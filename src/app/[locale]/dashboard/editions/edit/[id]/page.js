"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EditionForm from "../../../components/Editions/EditionForm";

export default function EditEditionPage() {
  const { id } = useParams();
  const [edition, setEdition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEdition() {
      try {
        const res = await fetch(`/api/editions/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el dossier");
        const data = await res.json();
        setEdition(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchEdition();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!edition) return <p>No se encontró el dossier.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <EditionForm mode="edit" edition={edition} />
    </div>
  );
}
