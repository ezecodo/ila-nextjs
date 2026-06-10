"use client";

import { useEffect, useState } from "react";

export default function AssignTranslatorCellEdition({ edition, onAssigned }) {
  const [translators, setTranslators] = useState([]);
  const [selectedTranslator, setSelectedTranslator] = useState(
    edition.translator?.id || ""
  );
  const [assigned, setAssigned] = useState(!!edition.translator);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar lista de traductores
  useEffect(() => {
    const fetchTranslators = async () => {
      try {
        const res = await fetch("/api/users?assignable=1");
        if (!res.ok) throw new Error("Error al obtener traductores");
        const data = await res.json();
        setTranslators(data.users);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTranslators();
  }, []);

  // 🔹 Asignar o reasignar traductor
  const handleAssign = async () => {
    if (!selectedTranslator) {
      alert("Selecciona un traductor");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/editions/${edition.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translatorId: selectedTranslator,
          assignedAt: new Date().toISOString(),
          translationStatus: "assigned",
        }),
      });

      if (!res.ok) throw new Error("Error asignando traductor");
      const updated = await res.json();

      // Actualizar estado local (sin recargar)
      setAssigned(true);
      if (onAssigned) onAssigned(updated);

      // Mostrar notificación visual temporal
      const msg = document.createElement("div");
      msg.textContent = `✅ Dossier asignado a ${
        updated?.translator?.name || updated?.translator?.email || "traductor"
      }`;
      msg.className =
        "fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 transition-opacity duration-500 opacity-100";
      document.body.appendChild(msg);
      setTimeout(() => {
        msg.style.opacity = "0";
        setTimeout(() => msg.remove(), 500);
      }, 2500);
    } catch (err) {
      console.error(err);
      alert("No se pudo asignar el traductor");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Quitar traductor
  const handleUnassign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/editions/${edition.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translatorId: null,
          assignedAt: null,
          translationStatus: "not_assigned",
        }),
      });
      if (!res.ok) throw new Error("Error quitando traductor");

      const updated = await res.json();
      setAssigned(false);
      setSelectedTranslator("");
      if (onAssigned) onAssigned(updated);
    } catch (err) {
      console.error(err);
      alert("No se pudo quitar el traductor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Si está asignado, mostrar nombre + fecha + select */}
      {assigned && edition.translator ? (
        <div className="flex items-center gap-3">
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

          {edition.assignedAt && (
            <span className="text-gray-500 text-xs">
              {new Date(edition.assignedAt).toLocaleDateString("es-ES")}
            </span>
          )}

          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "..." : "Reasignar"}
          </button>

          <button
            onClick={handleUnassign}
            disabled={loading}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Quitar
          </button>
        </div>
      ) : (
        <>
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
            disabled={loading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "..." : "Asignar"}
          </button>
        </>
      )}
    </div>
  );
}
