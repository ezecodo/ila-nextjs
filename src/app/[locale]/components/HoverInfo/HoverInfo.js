import { useState } from "react";

export default function HoverInfo({
  id,
  name,
  entityType,
  className,
  context,
}) {
  const [hovered, setHovered] = useState(false);
  const [count, setCount] = useState(null);

  const handleMouseEnter = async () => {
    setHovered(true);

    try {
      const response = await fetch(
        `/api/count/${entityType}/${id}?context=${context || "articles"}`
      );
      if (!response.ok) throw new Error("Error al obtener la cantidad");

      const data = await response.json();
      setCount(data.count ?? 0);
    } catch (error) {
      console.error(`❌ Error obteniendo cantidad de ${entityType}:`, error);
      setCount("Error");
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const backgroundColor =
    {
      authors: "#d13120",
      regions: "#f0ad4e",
      topics: "#5bc0de",
      categories: "#d13120",
      editions: "#d13120",
    }[entityType] || "#333";

  return (
    <span
      className={`relative ${className || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {name}
      {hovered && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 text-white rounded shadow-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap"
          style={{
            backgroundColor,
          }}
        >
          {count !== null
            ? context === "editions"
              ? `${count} ediciones`
              : `${count} artículos`
            : "Cargando..."}
        </div>
      )}
    </span>
  );
}
