"use client";

import { useState } from "react";
import { FaSearch, FaTimes, FaPlus, FaCheck } from "react-icons/fa";

export default function SearchableMultiSelect({
  options = [],
  selectedIds = [],
  onToggle,
  placeholder = "Buscar...",
  locale = "de",
  icon = "🏷️",
  color = "blue",
  title = "Seleccionar opciones",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar opciones según búsqueda
  const filteredOptions = options.filter((option) => {
    const name = locale === "es" && option.nameES ? option.nameES : option.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Separar seleccionados y no seleccionados
  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));
  const unselectedOptions = filteredOptions.filter(
    (opt) => !selectedIds.includes(opt.id)
  );

  const colorClasses = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-300 dark:border-blue-700",
      hover: "hover:bg-blue-200 dark:hover:bg-blue-800/40",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-300 dark:border-green-700",
      hover: "hover:bg-green-200 dark:hover:bg-green-800/40",
      button: "bg-green-600 hover:bg-green-700",
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-300 dark:border-purple-700",
      hover: "hover:bg-purple-200 dark:hover:bg-purple-800/40",
      button: "bg-purple-600 hover:bg-purple-700",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div>
      {/* Tags seleccionados + Botón agregar */}
      <div className="flex flex-wrap gap-2 items-center">
        {selectedOptions.map((option) => (
          <span
            key={option.id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 ${colors.bg} ${colors.text} border ${colors.border} rounded-full text-sm font-medium transition-all hover:shadow-md`}
          >
            <span className="flex items-center gap-1">
              {icon}
              {locale === "es" && option.nameES ? option.nameES : option.name}
            </span>
            <button
              onClick={() => onToggle(option.id)}
              className={`${colors.hover} rounded-full p-0.5 transition-colors`}
            >
              <FaTimes size={10} />
            </button>
          </span>
        ))}

        {/* Botón para abrir modal */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-2 px-4 py-1.5 ${colors.button} text-white rounded-full text-sm font-medium transition-all hover:shadow-lg`}
        >
          <FaPlus size={12} />
          {selectedIds.length === 0 ? placeholder : "Agregar más"}
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {icon} {title}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            {/* Barra de búsqueda destacada */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <FaTimes className="text-gray-400" size={14} />
                  </button>
                )}
              </div>

              {/* Contador de seleccionados */}
              {selectedIds.length > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FaCheck className="text-green-500" />
                  <span>
                    {selectedIds.length} seleccionado
                    {selectedIds.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Opciones seleccionadas primero */}
              {selectedOptions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FaCheck className="text-green-500" />
                    Seleccionados ({selectedOptions.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {selectedOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onToggle(option.id)}
                        className={`p-3 ${colors.bg} ${colors.text} border-2 ${colors.border} rounded-lg text-left text-sm font-medium transition-all hover:shadow-md flex items-center justify-between group`}
                      >
                        <span className="flex items-center gap-2">
                          <FaCheck size={12} />
                          {locale === "es" && option.nameES
                            ? option.nameES
                            : option.name}
                        </span>
                        <FaTimes
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Divisor */}
              {selectedOptions.length > 0 && unselectedOptions.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 mb-6"></div>
              )}

              {/* Opciones disponibles */}
              {unselectedOptions.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Disponibles ({unselectedOptions.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {unselectedOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onToggle(option.id)}
                        className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 transition-all hover:shadow-md flex items-center gap-2 group"
                      >
                        <span
                          className={`w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded flex items-center justify-center group-hover:border-red-500 transition-colors`}
                        >
                          <FaPlus
                            size={10}
                            className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"
                          />
                        </span>
                        {locale === "es" && option.nameES
                          ? option.nameES
                          : option.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No se encontraron resultados"
                      : "No hay opciones disponibles"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedIds.length} de {options.length} seleccionados
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
