"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaGlobeAmericas,
  FaCheck, // <--- IMPORTANTE: AÑADIDO PARA EL BOTÓN DE CONFIRMAR
} from "react-icons/fa";

interface Region {
  id: number;
  name: string;
  nameES: string | null;
  parentId: number | null;
  _count?: {
    articles: number;
  };
}

export default function RegionsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Region>>({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<number | null>(null);
  const [filterNoTranslation, setFilterNoTranslation] = useState(false);

  // --- ESTADO DEL MODAL DE TRADUCCIÓN ---
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState({
    id: 0,
    name: "", // Nombre original
    suggestedTranslation: "", // Traducción de la IA
    finalTranslation: "", // Lo que el usuario va a guardar
  });

  // Verificar acceso admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Cargar regions
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => {
        const flattenRegions = (
          items: any[],
          result: Region[] = []
        ): Region[] => {
          items.forEach((item) => {
            result.push(item);
            if (item.children?.length > 0) {
              flattenRegions(item.children, result);
            }
          });
          return result;
        };
        setRegions(flattenRegions(data));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando regions:", err);
        setLoading(false);
      });
  }, []);

  const filteredRegions = regions.filter((region) => {
    const matchesSearch =
      region.name.toLowerCase().includes(search.toLowerCase()) ||
      region.nameES?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterNoTranslation ? !region.nameES : true;
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (region: Region) => {
    setEditingId(region.id);
    setEditForm({
      name: region.name,
      nameES: region.nameES || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/regions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setRegions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
        );
        setEditingId(null);
        setEditForm({});
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error guardando:", err);
      alert("Error al guardar");
    }
    setSaving(false);
  };

  const handleDelete = async (region: Region) => {
    if (
      !confirm(`¿Eliminar "${region.name}"? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/regions/${region.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRegions((prev) => prev.filter((r) => r.id !== region.id));
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error al eliminar");
    }
  };

  // --- NUEVA LÓGICA DE TRADUCCIÓN CON MODAL ---

  const handleTranslate = async (region: Region) => {
    setTranslating(region.id);
    try {
      const res = await fetch("/api/translate/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: region.name,
          type: "region", // CAMBIO CLAVE: tipo 'region'
          id: region.id,
        }),
      });

      if (res.ok) {
        const { translated } = await res.json();
        setCurrentTranslation({
          id: region.id,
          name: region.name,
          suggestedTranslation: translated,
          finalTranslation: translated,
        });
        setShowTranslationModal(true);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error traduciendo:", err);
      alert("Error al traducir");
    }
    setTranslating(null);
  };

  const handleSaveTranslation = async () => {
    const { id, name, finalTranslation } = currentTranslation;

    try {
      const res = await fetch(`/api/regions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // ENVÍAMOS AMBOS: name Y nameES
        body: JSON.stringify({
          name: name,
          nameES: finalTranslation,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRegions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
        );
        setShowTranslationModal(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error guardando traducción:", err);
      alert("Error al guardar la traducción");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Regiones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra las regiones y países de Latinoamérica.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-shadow shadow-sm"
            />
          </div>
          <button
            onClick={() => setFilterNoTranslation(!filterNoTranslation)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterNoTranslation
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {filterNoTranslation ? "✓ Sin traducción" : "⚡ Sin traducción"}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Total de Regiones Registradas
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {regions.length}
          </p>
        </div>
        <div className="h-10 w-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-200">
          <FaGlobeAmericas />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Región
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Nombre (ES)
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                  Artículos
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRegions.map((region) => (
                <tr
                  key={region.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150"
                >
                  {editingId === region.id ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={editForm.name || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="block w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <input
                          type="text"
                          value={editForm.nameES || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, nameES: e.target.value })
                          }
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Editando...
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave(region.id)}
                            disabled={saving}
                            className="p-2 text-white bg-green-600 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Guardar"
                          >
                            <FaSave size={14} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 text-white bg-gray-500 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            title="Cancelar"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {getInitials(region.name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {region.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {region.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {region.nameES || (
                            <span className="italic text-gray-400">
                              Sin traducción
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            region._count?.articles === 0
                              ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                              : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                          }`}
                        >
                          {region._count?.articles || 0}{" "}
                          {locale === "es" ? "arts." : "Art."}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Traducir Modal */}
                          <button
                            onClick={() => handleTranslate(region)}
                            disabled={translating === region.id}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Traducir con DeepL"
                          >
                            {translating === region.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <span>⚡</span>
                            )}
                          </button>

                          <button
                            onClick={() => handleEdit(region)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(region)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredRegions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No se encontraron regiones con ese nombre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE TRADUCCIÓN --- */}
      {showTranslationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Traducción Automática
              </h3>
              <button
                onClick={() => setShowTranslationModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Original ({locale === "es" ? "Alemán" : "Deutsch"})
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  {currentTranslation.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                  Traducción (Español) - Edita si es necesario
                </label>
                <textarea
                  value={currentTranslation.finalTranslation}
                  onChange={(e) =>
                    setCurrentTranslation({
                      ...currentTranslation,
                      finalTranslation: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  La IA ha sugerido el texto. Puedes editarlo antes de guardar.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowTranslationModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTranslation}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-md"
              >
                <FaCheck size={14} />
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
