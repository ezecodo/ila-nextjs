"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import ArticleSelector from "../components/ArticleSelector/ArticleSelector";
import EditionSelector from "../components/EditionSelector/EditionSelector";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import LatinAmericaBackground from "../../components/LatinAmericaBackground/LatinAmericaBackground";
import IlaLogo from "../../components/IlaLogo/IlaLogo";
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
  const [showEditionSelector, setShowEditionSelector] = useState(false);
  const [newLink, setNewLink] = useState({
    title: "",
    titleES: "",
    url: "",
    icon: "",
    category: "",
    isFeatured: false,
    startDate: "",
    endDate: "",
    authorName: "",
    imageUrl: "",
    linkType: "general", // "general" | "article" | "edition"
    editionNumber: null,
    editionCoverImage: "",
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
      linkType: link.linkType || "general",
      editionNumber: link.editionNumber || null,
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
          prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
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
            l.id === link.id ? { ...l, isActive: !l.isActive } : l,
          ),
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
            l.id === link.id ? { ...l, isFeatured: !l.isFeatured } : l,
          ),
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
          authorName: "",
          imageUrl: "",
          linkType: "general",
          editionNumber: null,
          editionCoverImage: "",
        });
        setShowAddForm(false);
        setShowArticleSelector(false);
        setShowEditionSelector(false);
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

  const handleEditionSelected = (edition) => {
    setNewLink({
      ...newLink,
      title: `ila ${edition.number}: ${edition.title}`,
      titleES: edition.titleES
        ? `ila ${edition.number}: ${edition.titleES}`
        : `ila ${edition.number}: ${edition.title}`,
      url: `https://ila-web.de/ausgaben/${edition.number}`,
      icon: "book",
      category: "editions",
      isFeatured: true,
      linkType: "edition",
      editionNumber: edition.number,
      editionCoverImage: edition.coverImage || "",
      imageUrl: edition.coverImage || "",
      authorName: edition.subtitle || "",
    });
    setShowEditionSelector(false);
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

  // Componente para renderizar link de edición en el preview
  const EditionLinkPreview = ({ link }) => {
    const title =
      previewLocale === "es" && link.titleES ? link.titleES : link.title;
    const subtitle = link.authorName; // Usamos authorName para el subtítulo

    return (
      <div className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-lg shadow-red-200/50 ring-2 ring-red-500/30">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <div className="relative flex items-center gap-3 p-3">
          {/* Mini mockup de revista */}
          <div className="relative flex-shrink-0">
            {/* Sombra */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-1.5 bg-black/30 blur-sm rounded-full" />

            {/* Páginas traseras */}
            <div className="absolute top-0.5 -right-0.5 w-full h-full bg-white/20 rounded-[2px]" />
            <div className="absolute top-1 -right-1 w-full h-full bg-white/10 rounded-[2px]" />

            {/* Portada */}
            <div className="relative w-11 h-16 rounded-[2px] shadow-lg overflow-hidden transform transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-105">
              {link.editionCoverImage || link.imageUrl ? (
                <img
                  src={link.editionCoverImage || link.imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white to-gray-100 flex flex-col items-center justify-center">
                  <span
                    className="text-red-600 text-base font-bold"
                    style={{ fontFamily: "Futura, sans-serif" }}
                  >
                    ila
                  </span>
                  <span className="text-red-700 text-sm font-black">
                    {link.editionNumber || ""}
                  </span>
                </div>
              )}
              {/* Reflejo */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {link.editionNumber && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20">
                  #{link.editionNumber}
                </span>
              )}
              <span className="text-[8px] uppercase tracking-wide text-red-200">
                {previewLocale === "es" ? "Nueva edición" : "Neue Ausgabe"}
              </span>
            </div>
            <p className="font-bold text-sm leading-tight truncate">
              {link.editionNumber
                ? title.replace(`ila ${link.editionNumber}: `, "")
                : title}
            </p>
            {subtitle && (
              <p className="text-[10px] text-red-100 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Flecha */}
          <div className="flex-shrink-0 text-red-200 group-hover:text-white group-hover:translate-x-1 transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>

        {/* Badge */}
        <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-xl shadow-sm">
          📖
        </div>
      </div>
    );
  };

  // Componente para renderizar link normal en el preview
  const NormalLinkPreview = ({ link }) => {
    return (
      <div
        className={`w-full group relative transition-all duration-200 text-left border flex items-center shadow-sm ${
          link.isFeatured
            ? "bg-[#e60000] border-[#e60000] text-white"
            : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
        }`}
      >
        <div
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border-r ${
            link.isFeatured
              ? "border-white/10"
              : "border-gray-100 dark:border-gray-800 text-[#e60000]"
          }`}
        >
          {link.imageUrl ? (
            <img
              src={link.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="scale-75">{getIcon(link.icon)}</div>
          )}
        </div>
        <div className="flex-1 px-3 py-2 min-w-0">
          <span className="font-bold futura text-[11px] uppercase leading-tight block truncate">
            {getPreviewTitle(link)}
          </span>
          {link.authorName && (
            <span
              className={`text-[8px] font-black uppercase tracking-widest block mt-0.5 ${
                link.isFeatured ? "text-white/70" : "text-gray-400"
              }`}
            >
              {link.authorName}
            </span>
          )}
        </div>
      </div>
    );
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
                {/* Selectores de contenido */}
                <div className="md:col-span-2 mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tipo de contenido (opcional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowArticleSelector(!showArticleSelector);
                        setShowEditionSelector(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        showArticleSelector
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      <FaNewspaper size={14} />
                      {showArticleSelector ? "✕ Cerrar" : "📄 Artículo"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowEditionSelector(!showEditionSelector);
                        setShowArticleSelector(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        showEditionSelector
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                    >
                      <FaBook size={14} />
                      {showEditionSelector ? "✕ Cerrar" : "📖 Edición/Dossier"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selecciona un artículo o edición para auto-rellenar los
                    campos, o déjalo vacío para crear un link manual.
                  </p>
                </div>

                {/* Selector de artículos */}
                {showArticleSelector && (
                  <div className="md:col-span-2 mb-4 border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <ArticleSelector
                      onArticlesSelected={(articles) => {
                        if (articles.length > 0) {
                          const article = articles[0];
                          const articleUrl = article.legacyPath;
                          const imageUrl =
                            article.images?.[0]?.url ||
                            article.articleImage ||
                            "";

                          setNewLink({
                            ...newLink,
                            title: article.title,
                            titleES: article.titleES || article.title,
                            url: `https://ila-web.de${articleUrl}`,
                            icon: "newspaper",
                            category: "articles",
                            authorName:
                              article.authors?.map((a) => a.name).join(", ") ||
                              "",
                            imageUrl: imageUrl,
                            linkType: "article",
                            editionNumber: null,
                            editionCoverImage: "",
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

                {/* Selector de ediciones */}
                {showEditionSelector && (
                  <div className="md:col-span-2 mb-4 border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                      <FaBook />
                      Seleccionar Edición
                    </h3>
                    <EditionSelector
                      onEditionSelected={handleEditionSelected}
                      maxSelections={1}
                    />
                  </div>
                )}

                {/* Indicador de tipo seleccionado */}
                {newLink.linkType !== "general" && (
                  <div className="md:col-span-2">
                    <div
                      className={`rounded-lg p-3 flex items-center gap-3 ${
                        newLink.linkType === "edition"
                          ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700"
                          : "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                      }`}
                    >
                      {newLink.linkType === "edition" ? (
                        <>
                          <FaBook className="text-purple-600" />
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            Tipo: Edición #{newLink.editionNumber}
                          </span>
                        </>
                      ) : (
                        <>
                          <FaNewspaper className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Tipo: Artículo
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setNewLink({
                            ...newLink,
                            linkType: "general",
                            editionNumber: null,
                            editionCoverImage: "",
                          })
                        }
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cambiar a manual
                      </button>
                    </div>
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
                    onClick={() => {
                      setShowAddForm(false);
                      setShowArticleSelector(false);
                      setShowEditionSelector(false);
                    }}
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
                      Tipo
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
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                            link.linkType === "edition"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              : link.linkType === "article"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {link.linkType === "edition" && <FaBook size={10} />}
                          {link.linkType === "article" && (
                            <FaNewspaper size={10} />
                          )}
                          {link.linkType === "edition"
                            ? `Edición #${link.editionNumber || ""}`
                            : link.linkType === "article"
                              ? "Artículo"
                              : categoryOptions.find(
                                  (c) => c.value === link.category,
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

        {/* ===== COLUMNA DERECHA: Preview (Mockup) ===== */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FaEye className="text-red-600" /> Vista previa
            </h2>

            {/* MOCKUP DEL CELULAR */}
            <div className="relative mx-auto w-full max-w-[320px] h-[600px] bg-white dark:bg-gray-900 border-[8px] border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden ring-4 ring-gray-700/20">
              {/* Sensor de cámara del mockup */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-[60]" />

              {/* HEADER IDENTICO AL SCREENSHOT 1 (SIN MENU) */}
              <div className="w-full flex items-center bg-[#e60000] text-white relative overflow-hidden h-14 z-50">
                {/* Fondo de países con opacidad suave */}
                <LatinAmericaBackground variant="mobile" />

                {/* Contenedor principal con padding-top para esquivar el notch del mockup */}
                {/* HEADER IDENTICO AL SCREENSHOT 1 (AJUSTADO: Logo más abajo, Tagline más pequeño) */}
                <div className="w-full flex items-center bg-[#e60000] text-white relative overflow-hidden h-16 z-50">
                  {/* Fondo de países con opacidad suave */}
                  <div className="absolute inset-0 opacity-20">
                    <LatinAmericaBackground variant="mobile" />
                  </div>

                  {/* Sensor de cámara del mockup */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-[70]" />

                  {/* Contenedor principal 
      pt-3: Baja el contenido (logo y tagline) para que no pegue al notch 
  */}
                  <div className="relative z-10 w-full h-full flex items-center justify-between pt-4 pb-1">
                    {/* 1. LOGO IZQUIERDA: Le agregamos ml-2 para empujarlo a la derecha */}
                    <div className="bg-[#e60000] w-14 h-full flex items-center justify-center z-20 flex-shrink-0 ml-1">
                      <IlaLogo
                        size="default"
                        isLink={false}
                        variant="white-solid"
                        className="transform scale-90 translate-x-1"
                      />
                    </div>

                    {/* 2. TAGLINE: Manteniendo el tamaño potente que definimos */}
                    <div className="absolute inset-0 flex items-center justify-center pt-4 pointer-events-none px-12 z-10">
                      <span
                        className="futura text-[17px] font-bold text-white whitespace-nowrap leading-none tracking-tighter text-center"
                        style={{
                          fontFamily: "'Futura', sans-serif",
                          transform: "translateX(12px)", // Ajustamos esto si el logo lo "empuja" visualmente
                        }}
                      >
                        {previewLocale === "es" ? (
                          <>
                            La revista de Am
                            <span
                              style={{
                                position: "relative",
                                display: "inline-block",
                              }}
                            >
                              e
                              <span
                                aria-hidden="true"
                                style={{
                                  position: "absolute",
                                  left: "0.24em",
                                  top: "0.12em",
                                  width: "0.17em",
                                  height: "0.08em",
                                  background: "#fff",
                                  borderRadius: "0.03em",
                                  transform: "rotate(-35deg)",
                                  zIndex: 2,
                                }}
                              />
                            </span>
                            rica Latina
                          </>
                        ) : (
                          "Das Lateinamerika-Magazin"
                        )}
                      </span>
                    </div>

                    {/* 3. ESPACIADOR DERECHA (Equilibrio visual) */}
                    <div className="w-10 h-full flex-shrink-0 z-20" />
                  </div>
                </div>
              </div>

              {/* CONTENIDO SCROLLABLE */}
              <div className="h-full overflow-y-auto pb-20 bg-white dark:bg-gray-950">
                <div className="p-4 pt-6 space-y-6">
                  {Object.entries(groupedLinks).map(
                    ([category, categoryLinks]) => (
                      <div key={category}>
                        <h3 className="flex items-center gap-2 mb-3">
                          <span className="text-[#e60000] text-[9px] font-black uppercase tracking-[0.2em]">
                            {previewLocale === "es"
                              ? categoryLabels[category]?.es
                              : categoryLabels[category]?.de}
                          </span>
                          <span className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></span>
                        </h3>
                        <div className="space-y-2">
                          {categoryLinks.map((link) =>
                            link.linkType === "edition" ? (
                              <EditionLinkPreview key={link.id} link={link} />
                            ) : (
                              <NormalLinkPreview key={link.id} link={link} />
                            ),
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Botón Switch de Idioma en el Preview */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-lg z-50">
                <button
                  onClick={() => setPreviewLocale("de")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${previewLocale === "de" ? "bg-red-600 text-white" : "text-gray-500"}`}
                >
                  DE
                </button>
                <button
                  onClick={() => setPreviewLocale("es")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${previewLocale === "es" ? "bg-red-600 text-white" : "text-gray-500"}`}
                >
                  ES
                </button>
              </div>
            </div>
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
