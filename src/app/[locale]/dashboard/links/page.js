"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link"; // <--- IMPORTANTE: AÑADIDO PARA NAVEGACIÓN
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaLink,
  FaStar,
  FaGripVertical,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const iconOptions = [
  { value: "", label: "Sin icono" },
  { value: "globe", label: "🌐 Web" },
  { value: "newspaper", label: "📰 Artículo" },
  { value: "calendar", label: "📅 Evento" },
  { value: "book", label: "📖 Edición" },
  { value: "envelope", label: "✉️ Email" },
  { value: "instagram", label: "📷 Instagram" },
  { value: "facebook", label: "👤 Facebook" },
  { value: "twitter", label: "🐦 Twitter" },
  { value: "youtube", label: "▶️ YouTube" },
];

const categoryOptions = [
  { value: "", label: "General" },
  { value: "articles", label: "Artículos" },
  { value: "events", label: "Eventos" },
  { value: "editions", label: "Ediciones" },
  { value: "social", label: "Redes Sociales" },
];

export default function LinksManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    title: "",
    titleES: "",
    url: "",
    icon: "",
    category: "",
    isFeatured: false,
    startDate: "",
    endDate: "",
  });

  // Verificar acceso admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Cargar links
  useEffect(() => {
    fetch("/api/links?all=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLinks(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando links:", err);
        setLoading(false);
      });
  }, []);

  const handleEdit = (link) => {
    setEditingId(link.id);
    setEditForm({
      title: link.title,
      titleES: link.titleES || "",
      url: link.url,
      icon: link.icon || "",
      category: link.category || "",
      isActive: link.isActive,
      isFeatured: link.isFeatured,
      startDate: link.startDate ? link.startDate.slice(0, 16) : "",
      endDate: link.endDate ? link.endDate.slice(0, 16) : "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
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

  const handleDelete = async (link) => {
    if (
      !confirm(`¿Eliminar "${link.title}"? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== link.id));
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error al eliminar");
    }
  };

  const handleToggleActive = async (link) => {
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, isActive: !link.isActive }),
      });

      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === link.id ? { ...l, isActive: !l.isActive } : l
          )
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleToggleFeatured = async (link) => {
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, isFeatured: !link.isFeatured }),
      });

      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === link.id ? { ...l, isFeatured: !l.isFeatured } : l
          )
        );
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) {
      alert("Título y URL son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });

      if (res.ok) {
        const created = await res.json();
        setLinks((prev) => [...prev, created]);
        setNewLink({
          title: "",
          titleES: "",
          url: "",
          icon: "",
          category: "",
          isFeatured: false,
          startDate: "",
          endDate: "",
        });
        setShowAddForm(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error creando:", err);
      alert("Error al crear link");
    }
    setSaving(false);
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
            Gestión de Links
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra los enlaces que aparecen en ila-web.de/links
          </p>
        </div>

        <div className="flex gap-3">
          {/* --- ARREGLO AQUÍ: Link completo --- */}
          <Link
            href={`/${locale}/links`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FaEye size={14} />
            Ver página
          </Link>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaPlus size={14} />
            Añadir link
          </button>
        </div>
      </div>

      {/* Formulario para añadir */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Nuevo Link
          </h2>
          <form
            onSubmit={handleAddLink}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título (DE) *
              </label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) =>
                  setNewLink({ ...newLink, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título (ES)
              </label>
              <input
                type="text"
                value={newLink.titleES}
                onChange={(e) =>
                  setNewLink({ ...newLink, titleES: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink({ ...newLink, url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icono
              </label>
              <select
                value={newLink.icon}
                onChange={(e) =>
                  setNewLink({ ...newLink, icon: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {iconOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <select
                value={newLink.category}
                onChange={(e) =>
                  setNewLink({ ...newLink, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha inicio (opcional)
              </label>
              <input
                type="datetime-local"
                value={newLink.startDate}
                onChange={(e) =>
                  setNewLink({ ...newLink, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha fin (opcional)
              </label>
              <input
                type="datetime-local"
                value={newLink.endDate}
                onChange={(e) =>
                  setNewLink({ ...newLink, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newLink.isFeatured}
                  onChange={(e) =>
                    setNewLink({ ...newLink, isFeatured: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  ⭐ Destacar este link
                </span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Crear link"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Total de Links
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {links.length}
          </p>
        </div>
        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-200">
          <FaLink />
        </div>
      </div>

      {/* Lista de links */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10 text-center">
                  #
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Categoría
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                  Clics
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                  Estado
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {links.map((link, index) => (
                <tr
                  key={link.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 ${
                    !link.isActive ? "opacity-50" : ""
                  }`}
                >
                  {/* --- ARREGLO AQUÍ: Icono de agarre añadido --- */}
                  <td className="px-4 py-4 text-gray-400 text-center">
                    <FaGripVertical className="cursor-grab mx-auto" />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {link.isFeatured && (
                        <FaStar className="text-yellow-500" size={14} />
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {link.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {link.url}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryOptions.find((c) => c.value === link.category)
                        ?.label || "General"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {link.clicks}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(link)}
                      className={`p-2 rounded-lg transition-colors ${
                        link.isActive
                          ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={
                        link.isActive
                          ? "Activo - clic para desactivar"
                          : "Inactivo - clic para activar"
                      }
                    >
                      {link.isActive ? (
                        <FaEye size={16} />
                      ) : (
                        <FaEyeSlash size={16} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleFeatured(link)}
                        className={`p-2 rounded-lg transition-colors ${
                          link.isFeatured
                            ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        title={
                          link.isFeatured
                            ? "Destacado - clic para quitar"
                            : "No destacado - clic para destacar"
                        }
                      >
                        <FaStar size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(link)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(link)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay links todavía. ¡Crea el primero!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
