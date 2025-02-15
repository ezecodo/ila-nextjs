import { useState } from "react";

export default function HoverInfo({ id, name, entityType, className }) {
  const [hovered, setHovered] = useState(false);
  const [count, setCount] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = async (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setHovered(true);

    try {
      const response = await fetch(`/api/count/${entityType}/${id}`);
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
      authors: "#d13120", // Rojo para autores
      regions: "#f0ad4e", // Amarillo para regiones
      topics: "#5bc0de", // Azul para topics
      categories: "#d13120", // Rojo para categorías
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
            whiteSpace: "nowrap", // 🔥 Mantiene el texto en una sola línea
            borderRadius: "4px", // 🔥 Esquinas más suaves
            fontSize: "12px", // 🔥 Ajusta el tamaño general
            padding: "4px 8px", // 🔥 Ajuste del padding
            fontWeight: "bold",
            display: "inline-flex", // 🔥 Mantiene todo alineado en línea
            alignItems: "center", // 🔥 Asegura alineación vertical
          }}
        >
          {count !== null ? (
            entityType === "authors" ? (
              <span
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {count} Artículos en
                <span
                  style={{
                    fontFamily: "Futura, sans-serif",
                    textTransform: "lowercase",
                    fontSize: "1.2rem", // 🔥 Aumentamos un poco sin desbalancear
                    fontWeight: "bold",
                    lineHeight: "1", // 🔥 Evita que se vea desalineado
                  }}
                >
                  ila
                </span>
              </span>
            ) : (
              `${count} artículos`
            )
          ) : (
            "Cargando..."
          )}
        </div>
      )}
    </span>
  );
}
