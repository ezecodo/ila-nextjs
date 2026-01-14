"use client";

import { useState, useEffect } from "react";
import { FaBook, FaCheck, FaSearch } from "react-icons/fa";

export default function EditionSelector({
  onEditionSelected,
  maxSelections = 1,
}) {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEdition, setSelectedEdition] = useState(null);

  useEffect(() => {
    fetch("/api/editions?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Ordenar por número descendente (más reciente primero)
          setEditions(data.sort((a, b) => b.number - a.number));
        } else if (data.editions) {
          setEditions(data.editions.sort((a, b) => b.number - a.number));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando ediciones:", err);
        setLoading(false);
      });
  }, []);

  const filteredEditions = editions.filter((edition) => {
    const search = searchTerm.toLowerCase();
    return (
      edition.number.toString().includes(search) ||
      edition.title?.toLowerCase().includes(search) ||
      edition.titleES?.toLowerCase().includes(search) ||
      edition.subtitle?.toLowerCase().includes(search)
    );
  });

  const handleSelect = (edition) => {
    setSelectedEdition(edition);
    onEditionSelected(edition);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <FaSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={14}
        />
        <input
          type="text"
          placeholder="Buscar por número o título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* Grid de ediciones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
        {filteredEditions.map((edition) => {
          const isSelected = selectedEdition?.id === edition.id;

          return (
            <button
              key={edition.id}
              type="button"
              onClick={() => handleSelect(edition)}
              className={`relative group text-left rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-red-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-red-300 hover:ring-offset-1"
              }`}
            >
              {/* Mockup de revista mini */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                {edition.coverImage ? (
                  <img
                    src={edition.coverImage}
                    alt={`ila ${edition.number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center p-2">
                    <span
                      className="text-white text-xl font-bold"
                      style={{ fontFamily: "Futura, sans-serif" }}
                    >
                      ila
                    </span>
                    <span className="text-white text-2xl font-black mt-1">
                      {edition.number}
                    </span>
                  </div>
                )}

                {/* Overlay con info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                  <span className="text-white text-xs font-bold">
                    #{edition.number}
                  </span>
                  <span className="text-white/90 text-[10px] truncate">
                    {edition.title}
                  </span>
                </div>

                {/* Badge isCurrent */}
                {edition.isCurrent && (
                  <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1.5 py-0.5 rounded">
                    ACTUAL
                  </div>
                )}

                {/* Check de selección */}
                {isSelected && (
                  <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <FaCheck className="text-white" size={14} />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredEditions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron ediciones
        </div>
      )}

      {/* Info de selección */}
      {selectedEdition && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3">
          <FaBook className="text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Edición seleccionada: ila {selectedEdition.number} -{" "}
              {selectedEdition.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
