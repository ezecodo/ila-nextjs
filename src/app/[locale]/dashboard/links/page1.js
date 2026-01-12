"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import ArticleSelector from "../components/ArticleSelector/ArticleSelector";
import IlaLoader from "../../components/IlaLoader/IlaLoader"; // Ajusta la ruta según tu estructura
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaLink,
  FaStar,
  FaGripVertical,
  FaEye,
  FaEyeSlash,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaGlobe,
  FaNewspaper,
  FaCalendarAlt,
  FaBook,
  FaEnvelope,
  FaExternalLinkAlt,
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

const iconMap = {
  globe: <FaGlobe size={18} />,
  newspaper: <FaNewspaper size={18} />,
  calendar: <FaCalendarAlt size={18} />,
  book: <FaBook size={18} />,
  envelope: <FaEnvelope size={18} />,
  instagram: <FaInstagram size={18} />,
  facebook: <FaFacebookF size={18} />,
  twitter: <FaTwitter size={18} />,
  youtube: <FaYoutube size={18} />,
};

const categoryLabels = {
  general: { de: "Allgemein", es: "General" },
  articles: { de: "Artikel", es: "Artículos" },
  events: { de: "Veranstaltungen", es: "Eventos" },
  editions: { de: "Ausgaben", es: "Ediciones" },
  social: { de: "Soziale Netzwerke", es: "Redes Sociales" },
};

export default function LinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewLocale, setPreviewLocale] = useState("de");
  const [showArticleSelector, setShowArticleSelector] = useState(false);
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

  // Filtrar links activos para el preview
  const activeLinks = links.filter((l) => l.isActive);

  // Agrupar
  const groupedLinks = activeLinks.reduce((acc, link) => {
    const cat = link.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {});

  const getPreviewTitle = (link) => {
    if (previewLocale === "es" && link.titleES) return link.titleES;
    return link.title;
  };

  const getIcon = (icon) => {
    if (!icon) return <FaExternalLinkAlt size={16} />;
    return iconMap[icon] || <FaExternalLinkAlt size={16} />;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ===== COLUMNA IZQUIERDA: Gestión ===== */}
        <div className="flex-1 min-w-0">
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
              <Link
                href={`/${locale}/links`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FaEye size={14} />
                Abrir página
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
                {/* Selector de artículo */}
                <div className="md:col-span-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowArticleSelector(!showArticleSelector)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                  >
                    {showArticleSelector
                      ? "✕ Cerrar selector"
                      : "📄 Seleccionar artículo"}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional: selecciona un artículo para auto-rellenar título y
                    URL
                  </p>
                </div>

                {showArticleSelector && (
                  <div className="md:col-span-2 mb-4 border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <ArticleSelector
                      onArticlesSelected={(articles) => {
                        if (articles.length > 0) {
                          const article = articles[0];
                          const articleUrl = article.legacyPath
                            ? `/${locale}${article.legacyPath}`
                            : `/${locale}/articles/${article.id}`;

                          setNewLink({
                            ...newLink,
                            title: article.title,
                            titleES: article.titleES || article.title,
                            url: `https://ila-web.de${articleUrl}`,
                            icon: "newspaper",
                            category: "articles",
                          });
                          setShowArticleSelector(false);
                        }
                      }}
                      maxSelections={1}
                      showFilters={true}
                      allowReordering={false}
                      includeNurOnline={true}
                      includeByAuthor={true}
                      includeAllPublished={true}
                    />
                  </div>
                )}

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
          {/* Modal de edición */}
          {editingId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Editar Link
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título (DE) *
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título (ES)
                    </label>
                    <input
                      type="text"
                      value={editForm.titleES || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, titleES: e.target.value })
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
                      value={editForm.url || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, url: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Icono
                    </label>
                    <select
                      value={editForm.icon || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, icon: e.target.value })
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
                      value={editForm.category || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
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
                      Fecha inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.startDate || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha fin
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.endDate || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isFeatured || false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            isFeatured: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        ⭐ Destacado
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isActive || false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            isActive: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        ✓ Activo
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave(editingId)}
                    disabled={saving}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg flex items-center justify-between">
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
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Activos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeLinks.length}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-200">
                <FaEye />
              </div>
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
                  {links.map((link) => (
                    <tr
                      key={link.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 ${
                        !link.isActive ? "opacity-50" : ""
                      }`}
                    >
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
                          {categoryOptions.find(
                            (c) => c.value === link.category
                          )?.label || "General"}
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

        {/* ===== COLUMNA DERECHA: Preview Móvil ===== */}
        <div className="lg:w-[380px] flex-shrink-0">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vista Previa
              </h2>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setPreviewLocale("de")}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    previewLocale === "de"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  DE
                </button>
                <button
                  onClick={() => setPreviewLocale("es")}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    previewLocale === "es"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  ES
                </button>
              </div>
            </div>

            {/* Mockup del iPhone */}
            <div className="relative mx-auto w-[320px]">
              <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl border border-gray-800">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />

                {/* Pantalla */}
                <div className="relative bg-[#050505] rounded-[2.5rem] overflow-hidden h-[640px]">
                  {/* Status bar */}
                  <div className="h-12 flex items-end justify-center pb-1">
                    <div className="w-20 h-1 bg-gray-700 rounded-full" />
                  </div>

                  {/* Contenido scrolleable */}
                  <div className="h-[580px] overflow-y-auto px-4 pb-8">
                    {/* Header con Logo Futura */}
                    <div className="text-center mb-6 pt-4">
                      <div className="relative mb-6 mx-auto w-fit">
                        <div className="w-28 h-28 rounded-sm bg-white flex items-center justify-center shadow-lg">
                          <span
                            className="text-5xl font-bold text-red-600"
                            style={{ fontFamily: "Futura, sans-serif" }}
                          >
                            ila
                          </span>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black px-2 py-0.5 rounded-full border border-red-600/30">
                          <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest">
                            Links
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 font-light tracking-wide">
                        {previewLocale === "es"
                          ? "La revista de América Latina"
                          : "Das Lateinamerika-Magazin"}
                      </p>
                    </div>

                    {/* Links por categoría */}
                    <div className="space-y-4">
                      {Object.entries(groupedLinks).map(
                        ([category, categoryLinks], index) => (
                          <div
                            key={category}
                            style={{
                              animation: `slideUp 0.6s ease-out forwards ${index * 0.1}s`,
                              opacity: 0,
                            }}
                          >
                            {Object.keys(groupedLinks).length > 1 && (
                              <h2 className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2 px-2">
                                {previewLocale === "es"
                                  ? categoryLabels[category]?.es || category
                                  : categoryLabels[category]?.de || category}
                              </h2>
                            )}
                            <div className="space-y-3">
                              {categoryLinks.map((link) => (
                                <div
                                  key={link.id}
                                  className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 text-left ${
                                    link.isFeatured
                                      ? "bg-white text-red-700 shadow-lg ring-1 ring-red-500/50"
                                      : "bg-white/5 backdrop-blur-sm text-white border border-white/5"
                                  }`}
                                >
                                  {link.isFeatured && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                  )}

                                  <div className="relative flex items-center gap-4 px-5 py-4">
                                    <span
                                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                        link.isFeatured
                                          ? "bg-red-100 text-red-600"
                                          : "bg-white/10 text-white"
                                      }`}
                                    >
                                      {getIcon(link.icon)}
                                    </span>
                                    <span className="flex-1 font-medium">
                                      {getPreviewTitle(link)}
                                    </span>
                                    <FaExternalLinkAlt
                                      size={14}
                                      className={`flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${
                                        link.isFeatured
                                          ? "text-red-400"
                                          : "text-white"
                                      }`}
                                    />
                                  </div>

                                  {link.isFeatured && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
                                      ⭐{" "}
                                      {previewLocale === "es"
                                        ? "Destacado"
                                        : "Empfohlen"}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}

                      {activeLinks.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No hay links activos
                        </div>
                      )}
                    </div>

                    {/* Redes sociales */}
                    <div className="mt-6 flex justify-center gap-3">
                      <div className="w-10 h-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white">
                        <FaInstagram size={18} />
                      </div>
                      <div className="w-10 h-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white">
                        <FaFacebookF size={16} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                      <span className="text-gray-500 text-sm">
                        ←{" "}
                        {previewLocale === "es"
                          ? "Visitar sitio web"
                          : "Zur Webseite"}
                      </span>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              Los cambios se reflejan en tiempo real
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}
