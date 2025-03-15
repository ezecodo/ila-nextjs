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
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = async (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
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

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  // 🔹 Definir colores según la entidad
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
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {name}
      {hovered && (
        <div
          className="fixed text-white rounded shadow-lg z-50 px-2 py-1 flex items-center"
          style={{
            left: `${position.x + 10}px`,
            top: `${position.y - 25}px`,
            backgroundColor,
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
            borderRadius: "4px",
            fontSize: "12px",
            padding: "4px 8px",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
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
