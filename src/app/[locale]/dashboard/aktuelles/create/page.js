"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AktuellesForm from "../AktuellesForm";

export default function CreateAktuellesPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // truco para evitar auto-focus de Quill
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

      const res = await fetch("/api/aktuelles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear Aktuelles");
      router.push("/dashboard/aktuelles");
    } catch (err) {
      console.error("❌ Error:", err);
      alert("No se pudo crear el Aktuelles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-purple-700">
        Neues Aktuelles erstellen
      </h1>

      <AktuellesForm onSubmit={handleCreate} loading={loading} isEdit={false} />
    </div>
  );
}
