// app/[locale]/dashboard/banners/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BannerSlide, { BANNER_HEIGHT } from "../../components/Banners/SlideBanner/BannerSlide";
import {
  BLOCK_DEFS,
  STAT_KEYS,
  STAT_REGISTRY,
  ALIGN_OPTIONS,
  DEFAULT_ALIGN,
  SIZE_OPTIONS,
  BODY_LINES_OPTIONS,
  KICKER_STYLE_OPTIONS,
  normalizeBlocks,
} from "../../components/Banners/SlideBanner/blocks";

// Fechas por defecto: la pestaña "Configuración" (donde viven startDate/endDate) solo
// monta sus inputs cuando está activa — si el admin nunca la abre, esos campos `required`
// no existen en el DOM al enviar y el navegador no los valida, así que el form podía viajar
// con fechas vacías. Arrancar con fechas válidas evita ese 500 sin depender de que abran la pestaña.
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function yearsFromNowISO(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function getBlankForm() {
  return {
    title: "",
    titleEs: "",
    subtitle: "",
    subtitleEs: "",
    description: "",
    descriptionEs: "",
    buttonText: "",
    buttonTextEs: "",
    buttonUrl: "",
    imageUrl: "",
    bgGradientFrom: "#dc2626",
    bgGradientTo: "#b91c1c",
    titleSize: "sm",
    subtitleSize: "3xl",
    descriptionSize: "base",
    buttonColor: "#dc2626",
    hasPromoForm: false,
    startDate: todayISO(),
    endDate: yearsFromNowISO(5),
    isActive: true,
    position: "top",
    type: "cta",
    order: 0,
    blocks: { align: DEFAULT_ALIGN, items: [] },
  };
}

const TYPE_LABELS = {
  cta: "🎯 Campaña / CTA (arriba de página)",
  custom: "🧩 Banner por bloques (sidebar)",
};

function getSizeClass(size, type) {
  const sizes = {
    title: {
      xs: "text-xs md:text-xs",
      sm: "text-xs md:text-sm",
      md: "text-sm md:text-base",
      lg: "text-base md:text-lg",
    },
    subtitle: {
      xl: "text-lg md:text-xl",
      "2xl": "text-xl md:text-2xl",
      "3xl": "text-xl md:text-3xl",
      "4xl": "text-2xl md:text-4xl",
    },
    description: {
      sm: "text-xs md:text-sm",
      base: "text-sm md:text-base",
      lg: "text-base md:text-lg",
    },
  };
  return sizes[type][size] || "";
}

// Diseño del banner tipo "cta" (campaña arriba de página) — un solo lugar para que la
// vista previa en vivo del editor y la miniatura de la lista nunca se desalineen entre sí.
function CtaPreviewCard({ banner }) {
  return (
    <div
      className="overflow-hidden shadow-md relative"
      style={{
        background: `linear-gradient(to bottom right, ${banner.bgGradientFrom}, ${banner.bgGradientTo})`,
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative px-8 py-6">
        <div className="flex items-center gap-6">
          <div className="bg-white rounded-sm w-20 h-20 flex items-center justify-center shadow-lg shrink-0">
            <span
              className="text-4xl font-bold text-red-600"
              style={{ fontFamily: "Futura, sans-serif" }}
            >
              ila
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {banner.title && (
              <div
                className={`text-red-100 font-semibold uppercase tracking-wider mb-2 ${getSizeClass(banner.titleSize, "title")}`}
              >
                {banner.title}
              </div>
            )}
            <h3
              className={`text-white font-bold leading-tight mb-2 ${getSizeClass(banner.subtitleSize, "subtitle")}`}
            >
              {banner.subtitle || "Subtítulo principal del banner"}
            </h3>
            <p
              className={`text-white/90 leading-relaxed ${getSizeClass(banner.descriptionSize, "description")}`}
            >
              {banner.description ||
                "Descripción detallada de la promoción o campaña."}
            </p>
          </div>

          {banner.imageUrl && (
            <div className="flex-shrink-0 relative h-32 w-40">
              <Image src={banner.imageUrl} alt="Preview" fill className="object-contain" />
            </div>
          )}

          <div className="flex-shrink-0">
            <div
              className="bg-white/95 rounded-lg px-6 py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2"
              style={{ borderColor: banner.buttonColor }}
            >
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold" style={{ color: banner.buttonColor }}>
                  {banner.buttonText || "Texto del botón"}
                </p>
                <span style={{ color: banner.buttonColor }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Miniatura de un banner tal como se ve realmente — mismo componente que la web pública
// (BannerSlide) o que la preview en vivo (CtaPreviewCard), escalado hacia abajo con CSS
// transform. Así el equipo identifica cada banner de un vistazo en vez de leer texto.
const THUMB_WIDTH = 180; // ancho "real" de referencia — la columna del sidebar en LatestEdition1
function BannerThumb({ banner, stats }) {
  const scale = THUMB_WIDTH / 380;
  const thumbHeight = Math.round(BANNER_HEIGHT * scale);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900"
      style={{ width: THUMB_WIDTH, height: thumbHeight }}
    >
      <div
        style={{
          width: 380,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {banner.type === "custom" ? (
          <BannerSlide banner={banner} stats={stats} locale="de" />
        ) : (
          <CtaPreviewCard banner={banner} />
        )}
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("content"); // content, design, settings
  const [siteStats, setSiteStats] = useState(null);

  const [formData, setFormData] = useState(getBlankForm);
  // Índice del bloque que se está arrastrando para reordenar (drag & drop
  // nativo, sin librería nueva) — null cuando no hay drag en curso.
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    fetchBanners();
    // Stats reales del sitio, para que la vista previa del bloque "stats" no muestre solo "…"
    fetch("/api/stats/site", { cache: "no-store" })
      .then((res) => res.json())
      .then(setSiteStats)
      .catch(() => {});
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners/all");
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/banners/${editingId}` : "/api/banners";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchBanners();
        resetForm();
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error saving banner:", error);
    }
  };

  const handleEdit = (banner) => {
    setFormData({
      title: banner.title,
      titleEs: banner.titleEs || "",
      subtitle: banner.subtitle,
      subtitleEs: banner.subtitleEs || "",
      description: banner.description,
      descriptionEs: banner.descriptionEs || "",
      buttonText: banner.buttonText,
      buttonTextEs: banner.buttonTextEs || "",
      buttonUrl: banner.buttonUrl,
      imageUrl: banner.imageUrl || "",
      bgGradientFrom: banner.bgGradientFrom || "#dc2626",
      bgGradientTo: banner.bgGradientTo || "#b91c1c",
      titleSize: banner.titleSize || "sm",
      subtitleSize: banner.subtitleSize || "3xl",
      descriptionSize: banner.descriptionSize || "base",
      buttonColor: banner.buttonColor || "#dc2626",
      hasPromoForm: banner.hasPromoForm || false,
      startDate: banner.startDate.split("T")[0],
      endDate: banner.endDate.split("T")[0],
      isActive: banner.isActive,
      position: banner.position,
      type: banner.type || "cta",
      order: banner.order ?? 0,
      blocks: normalizeBlocks(banner.blocks),
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este banner?")) return;

    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBanners();
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
  };

  const resetForm = () => {
    setFormData(getBlankForm());
    setEditingId(null);
    setActiveTab("content");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("folder", "banners");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (data.url) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen");
    }
  };


  // --- Blocks builder (solo type === "custom") — formData.blocks = { align, items } ---
  const setAlign = (align) => {
    setFormData((prev) => ({ ...prev, blocks: { ...prev.blocks, align } }));
  };

  const addBlock = (blockType) => {
    setFormData((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        items: [...prev.blocks.items, BLOCK_DEFS[blockType].create()],
      },
    }));
  };

  const updateBlock = (index, patch) => {
    setFormData((prev) => {
      const items = [...prev.blocks.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, blocks: { ...prev.blocks, items } };
    });
  };

  const removeBlock = (index) => {
    setFormData((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        items: prev.blocks.items.filter((_, i) => i !== index),
      },
    }));
  };

  const moveBlock = (index, dir) => {
    setFormData((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.blocks.items.length) return prev;
      const items = [...prev.blocks.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, blocks: { ...prev.blocks, items } };
    });
  };

  // Reordenar arrastrando (además de los botones ↑↓): mueve el bloque `from`
  // a la posición `to` sin tocar nada del layout — sigue siendo el mismo
  // flujo automático, esto solo cambia el ORDEN, no coordenadas libres (eso
  // se descartó a propósito, ver historial de este feature en CLAUDE.md).
  const reorderBlocks = (from, to) => {
    setFormData((prev) => {
      if (from === to || from < 0 || to < 0) return prev;
      const items = [...prev.blocks.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...prev, blocks: { ...prev.blocks, items } };
    });
  };

  const toggleStatKey = (index, key) => {
    setFormData((prev) => {
      const items = [...prev.blocks.items];
      const current = items[index].keys || [];
      items[index] = {
        ...items[index],
        keys: current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key],
      };
      return { ...prev, blocks: { ...prev.blocks, items } };
    });
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Banners</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {showForm ? "Cancelar" : "Nuevo Banner"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
            {/* COLUMNA IZQUIERDA: preview, fija mientras se scrollea la configuración */}
            <div className="lg:sticky lg:top-6">
              <h3 className="text-lg font-semibold mb-4">
                👁️ Vista Previa en Vivo
              </h3>

              {/* Tipo de banner — determina qué campos aplican y cómo se ve */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Tipo de banner
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      type,
                      // atajo: "custom" vive en el sidebar, "cta" arriba de página
                      position:
                        type === "custom" && prev.position === "top"
                          ? "edition-sidebar"
                          : type === "cta" &&
                              (prev.position === "edition-sidebar" ||
                                prev.position === "edition-sidebar-stacked")
                            ? "top"
                            : prev.position,
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.type === "cta"
                    ? "Banner de campaña arriba de página (donación, promoción, etc)."
                    : "Armá el banner con los bloques que necesites: stats del archivo, texto libre, botones, fecha de evento, promo del Digital-Abo. Se usa en el slideshow del sidebar de edición — con 2+ banners activos ahí, rotan en carrusel."}
                </p>
              </div>

              {formData.type === "cta" ? (
                <CtaPreviewCard banner={formData} />
              ) : (
                // custom: misma pieza que se usa en la web pública (BannerSlide) —
                // evita que la preview del dashboard se desalinee del render real,
                // y muestra el recorte real si los bloques no entran en el alto fijo.
                <BannerSlide banner={formData} stats={siteStats} locale="de" />
              )}

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded">
                💡{" "}
                <strong>Tip:</strong>{" "}
                {formData.type === "custom"
                  ? "El banner tiene una altura fija: si el contenido no entra, se recorta (mismo comportamiento acá que en la web). Los bloques se acomodan solos uno al lado del otro y bajan de línea cuando no entran — nunca se pisan. Controlás el orden (↑↓) y la alineación general, abajo."
                  : "Los cambios se reflejan en tiempo real."}
              </div>
            </div>

            {/* COLUMNA DERECHA: tabs + formulario, scrollea independiente de la preview */}
            <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
              {/* TABS */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeTab === "content"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  📝 Contenido
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("design")}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeTab === "design"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  🎨 Diseño
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  ⚙️ Configuración
                </button>
              </div>

              {/* TAB: CONTENIDO */}
                {activeTab === "content" && formData.type === "cta" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Título Superior (DE)
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          placeholder="SONDERAKTION BIS JAHRESENDE"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Título Superior (ES)
                        </label>
                        <input
                          type="text"
                          value={formData.titleEs}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              titleEs: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          placeholder="PROMOCIÓN ESPECIAL"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Subtítulo Principal (DE) *
                        </label>
                        <textarea
                          value={formData.subtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          rows={2}
                          placeholder="Die ila schenkt dir 3 Monate..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Subtítulo Principal (ES)
                        </label>
                        <textarea
                          value={formData.subtitleEs}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtitleEs: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          rows={2}
                          placeholder="ila te regala 3 meses..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Descripción (DE) *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          rows={3}
                          placeholder="Schließe bis 31. Dezember..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Descripción (ES)
                        </label>
                        <textarea
                          value={formData.descriptionEs}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              descriptionEs: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          rows={3}
                          placeholder="Suscríbete antes del 31 de diciembre..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Texto del Botón (DE) *
                        </label>
                        <input
                          type="text"
                          value={formData.buttonText}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              buttonText: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          placeholder="Gültig bis 31. Dezember 2025"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Texto del Botón (ES)
                        </label>
                        <input
                          type="text"
                          value={formData.buttonTextEs}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              buttonTextEs: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          placeholder="Válido hasta 31 de diciembre 2025"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        URL del Botón *
                      </label>
                      <input
                        // "text" y no "url": ver comentario en el bloque CTA — un input
                        // type="url" borra en silencio cualquier valor que no sea una URL
                        // absoluta, y este campo también puede apuntar a rutas internas.
                        type="text"
                        value={formData.buttonUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buttonUrl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                        placeholder="https://example.com/promo"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Imagen Decorativa
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="flex-1 px-3 py-2 border rounded dark:bg-gray-700"
                        />
                        {formData.imageUrl && (
                          <Image
                            src={formData.imageUrl}
                            alt="Preview"
                            width={60}
                            height={60}
                            className="object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB: CONTENIDO — banner por bloques */}
                {activeTab === "content" && formData.type === "custom" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Alineación general del banner
                      </label>
                      <div className="flex gap-2">
                        {ALIGN_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAlign(opt.value)}
                            className={`px-3 py-1.5 text-sm rounded border ${
                              formData.blocks.align === opt.value
                                ? "bg-red-600 text-white border-red-600"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.blocks.items.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Todavía no agregaste ningún bloque. Elegí uno abajo
                        para empezar.
                      </p>
                    )}

                    {formData.blocks.items.map((block, index) => (
                      <div
                        key={index}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragIndex !== null && dragIndex !== index) {
                            setDragOverIndex(index);
                          }
                        }}
                        onDragLeave={() =>
                          setDragOverIndex((cur) => (cur === index ? null : cur))
                        }
                        onDrop={(e) => {
                          e.preventDefault();
                          reorderBlocks(dragIndex, index);
                          setDragIndex(null);
                          setDragOverIndex(null);
                        }}
                        className={`rounded-lg border p-4 transition-colors ${
                          dragOverIndex === index
                            ? "border-red-400 border-dashed bg-red-50/50 dark:bg-red-900/10"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-2 font-medium text-sm">
                            <span
                              draggable
                              onDragStart={(e) => {
                                setDragIndex(index);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDragIndex(null);
                                setDragOverIndex(null);
                              }}
                              title="Arrastrar para reordenar"
                              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 select-none"
                            >
                              ⠿
                            </span>
                            {index + 1}. {BLOCK_DEFS[block.type]?.label || block.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <select
                              value={block.size || "md"}
                              onChange={(e) =>
                                updateBlock(index, { size: e.target.value })
                              }
                              title="Tamaño del bloque"
                              className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                            >
                              {SIZE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, -1)}
                              disabled={index === 0}
                              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-30"
                              title="Subir"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, 1)}
                              disabled={index === formData.blocks.items.length - 1}
                              className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-30"
                              title="Bajar"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(index)}
                              className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                              title="Eliminar bloque"
                            >
                              🗑
                            </button>
                          </div>
                        </div>

                        {/* --- Stats --- */}
                        {block.type === "stats" && (
                          <div className="grid grid-cols-2 gap-2">
                            {STAT_KEYS.map((key) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={(block.keys || []).includes(key)}
                                  onChange={() => toggleStatKey(index, key)}
                                  className="rounded"
                                />
                                {STAT_REGISTRY[key].es} / {STAT_REGISTRY[key].de}
                              </label>
                            ))}
                          </div>
                        )}

                        {/* --- Texto --- */}
                        {block.type === "text" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={block.kickerDe}
                                onChange={(e) =>
                                  updateBlock(index, { kickerDe: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Kicker (DE)"
                              />
                              <input
                                type="text"
                                value={block.kickerEs}
                                onChange={(e) =>
                                  updateBlock(index, { kickerEs: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Kicker (ES)"
                              />
                            </div>
                            <select
                              value={block.kickerStyle || "plain"}
                              onChange={(e) =>
                                updateBlock(index, { kickerStyle: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                              title="Estética del kicker"
                            >
                              {KICKER_STYLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={block.titleDe}
                                onChange={(e) =>
                                  updateBlock(index, { titleDe: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Título (DE)"
                              />
                              <input
                                type="text"
                                value={block.titleEs}
                                onChange={(e) =>
                                  updateBlock(index, { titleEs: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Título (ES)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <textarea
                                value={block.bodyDe}
                                onChange={(e) =>
                                  updateBlock(index, { bodyDe: e.target.value })
                                }
                                rows={2}
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Texto (DE)"
                              />
                              <textarea
                                value={block.bodyEs}
                                onChange={(e) =>
                                  updateBlock(index, { bodyEs: e.target.value })
                                }
                                rows={2}
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Texto (ES)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Cuánto texto se ve (si no entra, se recorta con &quot;…&quot;)
                              </label>
                              <select
                                value={block.bodyLines ?? 3}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    bodyLines: Number(e.target.value),
                                  })
                                }
                                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                              >
                                {BODY_LINES_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* --- CTA --- */}
                        {block.type === "cta" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={block.labelDe}
                                onChange={(e) =>
                                  updateBlock(index, { labelDe: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Texto del botón (DE)"
                              />
                              <input
                                type="text"
                                value={block.labelEs}
                                onChange={(e) =>
                                  updateBlock(index, { labelEs: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Texto del botón (ES)"
                              />
                            </div>
                            <input
                              // "text" y no "url": los bloques CTA suelen apuntar a rutas
                              // internas del sitio (/order/abo, /support/donations...) — un
                              // input type="url" exige una URL absoluta con esquema y borra
                              // en silencio cualquier valor que no lo sea (ver sanitization
                              // algorithm de HTML), así que una ruta relativa desaparecía del
                              // campo aunque el dato siguiera bien guardado en la base.
                              type="text"
                              value={block.url}
                              onChange={(e) =>
                                updateBlock(index, { url: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                              placeholder="/order/abo o https://..."
                            />
                          </div>
                        )}

                        {/* --- Fecha de evento --- */}
                        {block.type === "eventDate" && (
                          <input
                            type="datetime-local"
                            value={block.date}
                            onChange={(e) =>
                              updateBlock(index, { date: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                          />
                        )}

                        {/* --- Promo Digital-Abo --- */}
                        {block.type === "digiAbo" && (
                          <div className="space-y-3">
                            <p className="text-xs text-gray-500">
                              Enlaza siempre a /order/digital-abo. Dejá el
                              texto vacío para usar el texto por defecto.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <textarea
                                value={block.pitchDe}
                                onChange={(e) =>
                                  updateBlock(index, { pitchDe: e.target.value })
                                }
                                rows={2}
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Texto (DE, opcional)"
                              />
                              <textarea
                                value={block.pitchEs}
                                onChange={(e) =>
                                  updateBlock(index, { pitchEs: e.target.value })
                                }
                                rows={2}
                                className="w-full px-3 py-2 border rounded dark:bg-gray-700 text-sm"
                                placeholder="Texto (ES, opcional)"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div>
                      <p className="text-sm font-medium mb-2">
                        + Agregar bloque
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(BLOCK_DEFS).map(([type, def]) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addBlock(type)}
                            className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {def.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: DISEÑO */}
                {activeTab === "design" && (
                  <>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          {formData.type === "custom"
                            ? "Color de fondo (mismo color en ambos = sólido)"
                            : "Gradiente de Fondo"}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Color Inicio
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.bgGradientFrom}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    bgGradientFrom: e.target.value,
                                  })
                                }
                                className="w-16 h-10 rounded border"
                              />
                              <input
                                type="text"
                                value={formData.bgGradientFrom}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    bgGradientFrom: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 font-mono text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Color Fin
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.bgGradientTo}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    bgGradientTo: e.target.value,
                                  })
                                }
                                className="w-16 h-10 rounded border"
                              />
                              <input
                                type="text"
                                value={formData.bgGradientTo}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    bgGradientTo: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {formData.type === "cta" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-3">
                              Tamaño Título Superior
                            </label>
                            <select
                              value={formData.titleSize}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  titleSize: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                            >
                              <option value="xs">Extra Pequeño (xs)</option>
                              <option value="sm">Pequeño (sm)</option>
                              <option value="md">Mediano (md)</option>
                              <option value="lg">Grande (lg)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-3">
                              Tamaño Subtítulo Principal
                            </label>
                            <select
                              value={formData.subtitleSize}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  subtitleSize: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                            >
                              <option value="xl">Extra Grande (xl)</option>
                              <option value="2xl">2X Grande (2xl)</option>
                              <option value="3xl">3X Grande (3xl)</option>
                              <option value="4xl">4X Grande (4xl)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-3">
                              Tamaño Descripción
                            </label>
                            <select
                              value={formData.descriptionSize}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  descriptionSize: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                            >
                              <option value="sm">Pequeño (sm)</option>
                              <option value="base">Normal (base)</option>
                              <option value="lg">Grande (lg)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-3">
                              Color del Botón
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.buttonColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    buttonColor: e.target.value,
                                  })
                                }
                                className="w-16 h-10 rounded border"
                              />
                              <input
                                type="text"
                                value={formData.buttonColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    buttonColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 font-mono text-sm"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* TAB: CONFIGURACIÓN */}
                {activeTab === "settings" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Fecha Inicio *
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Fecha Fin *
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Posición en la Página
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                      >
                        <option value="top">Arriba (Top)</option>
                        <option value="middle">Medio (Middle)</option>
                        <option value="bottom">Abajo (Bottom)</option>
                        <option value="edition-sidebar">
                          Sidebar de Edición — Carrusel (rotan)
                        </option>
                        <option value="edition-sidebar-stacked">
                          Sidebar de Edición — Apilado (todos visibles)
                        </option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Carrusel: si hay 2+ banners activos ahí, rotan uno a la vez. Apilado:
                        todos los banners activos se muestran juntos, uno debajo del otro,
                        siempre visibles.
                      </p>
                    </div>

                    {(formData.position === "edition-sidebar" ||
                      formData.position === "edition-sidebar-stacked") && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Orden
                        </label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              order: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Menor número aparece antes. Con 2 o más banners
                          activos en esta posición, se muestran en carrusel.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Banner Activo</span>
                    </div>

                    {formData.type === "cta" && (
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          checked={formData.hasPromoForm}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hasPromoForm: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm font-medium">
                          🎁 Activar Formulario de Regalo Promocional
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* BOTONES */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                  >
                    {editingId ? "Actualizar Banner" : "Crear Banner"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTA DE BANNERS */}
      <div className="grid gap-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4"
          >
            <BannerThumb banner={banner} stats={siteStats} />

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">
                {banner.title ||
                  banner.subtitle ||
                  (normalizeBlocks(banner.blocks).items.length
                    ? `Banner de ${normalizeBlocks(banner.blocks).items.length} bloque(s)`
                    : "(sin título)")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {banner.subtitle}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                  {TYPE_LABELS[banner.type] || TYPE_LABELS.cta}
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                  📍 {banner.position}
                  {(banner.position === "edition-sidebar" ||
                    banner.position === "edition-sidebar-stacked") &&
                    ` · orden ${banner.order}`}
                </span>
                <span className="flex items-center">
                  {new Date(banner.startDate).toLocaleDateString()} -{" "}
                  {new Date(banner.endDate).toLocaleDateString()}
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    banner.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {banner.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(banner)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(banner.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
