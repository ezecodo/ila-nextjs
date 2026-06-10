"use client";

import { useEffect, useState } from "react";

export default function AssignTranslatorCell({ article, onAssigned }) {
  const [translators, setTranslators] = useState([]);
  const [selectedTranslator, setSelectedTranslator] = useState(
    article.translator?.id || ""
  );

  // Cargar traductores (usuarios con rol translator)
  useEffect(() => {
    const fetchTranslators = async () => {
      try {
        const res = await fetch("/api/users?assignable=1");
        if (!res.ok) throw new Error("Error al obtener traductores");
        const data = await res.json();
        setTranslators(data.users);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTranslators();
  }, []);

  // Asignar/Reasignar traductor
  const handleAssign = async () => {
    if (!selectedTranslator) {
      alert("Selecciona un traductor");
      return;
    }
    try {
      const res = await fetch(`/api/articles/${article.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translatorId: selectedTranslator }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Error asignando traductor: ${errText}`);
      }

      const updated = await res.json();
      alert(
        `Artículo asignado a ${
          updated?.translator?.name || updated?.translator?.email || "traductor"
        }`
      );
      onAssigned(updated);
    } catch (error) {
      console.error(error);
      alert("No se pudo asignar traductor");
    }
  };

  // Quitar asignación
  const handleUnassign = async () => {
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unassignTranslator: true }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Error quitando traductor");
      }

      const updated = await res.json();
      alert("Asignación eliminada");
      onAssigned(updated); // ✅ actualiza la fila en la tabla
      setSelectedTranslator(""); // ✅ limpia el <select>
    } catch (error) {
      console.error("Unassign failed:", error);
      alert("No se pudo quitar la asignación");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded p-1 text-sm"
        value={selectedTranslator}
        onChange={(e) => setSelectedTranslator(e.target.value)}
      >
        <option value="">-- Seleccionar --</option>
        {translators.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name || t.email}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {article.translator ? "Reasignar" : "Asignar"}
      </button>
      {article.translator && (
        <button
          onClick={handleUnassign}
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Quitar
        </button>
      )}
    </div>
  );
}
