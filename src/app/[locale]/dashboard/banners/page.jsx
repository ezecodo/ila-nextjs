// app/[locale]/dashboard/banners/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("content"); // content, design, settings

  const [formData, setFormData] = useState({
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
    startDate: "",
    endDate: "",
    isActive: true,
    position: "top",
  });

  useEffect(() => {
    fetchBanners();
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
    setFormData({
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
      startDate: "",
      endDate: "",
      isActive: true,
      position: "top",
    });
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

  const getSizeClass = (size, type) => {
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
          {/* PREVIEW STICKY - TAMAÑO COMPLETO */}
          <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                👁️ Vista Previa en Vivo
              </h3>

              <div
                className="overflow-hidden shadow-md relative"
                style={{
                  background: `linear-gradient(to bottom right, ${formData.bgGradientFrom}, ${formData.bgGradientTo})`,
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
                    <div className="bg-white rounded-sm w-20 h-20 flex items-center justify-center shadow-lg">
                      <span
                        className="text-4xl font-bold text-red-600"
                        style={{ fontFamily: "Futura, sans-serif" }}
                      >
                        ila
                      </span>
                    </div>

                    <div className="flex-1">
                      {formData.title && (
                        <div
                          className={`text-red-100 font-semibold uppercase tracking-wider mb-2 ${getSizeClass(formData.titleSize, "title")}`}
                        >
                          {formData.title}
                        </div>
                      )}
                      <h3
                        className={`text-white font-bold leading-tight mb-2 ${getSizeClass(formData.subtitleSize, "subtitle")}`}
                      >
                        {formData.subtitle || "Subtítulo principal del banner"}
                      </h3>
                      <p
                        className={`text-white/90 leading-relaxed ${getSizeClass(formData.descriptionSize, "description")}`}
                      >
                        {formData.description ||
                          "Descripción detallada de la promoción o campaña."}
                      </p>
                    </div>

                    {formData.imageUrl && (
                      <div className="flex-shrink-0 relative h-32 w-40">
                        <Image
                          src={formData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-shrink-0">
                      <div
                        className="bg-white/95 rounded-lg px-6 py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2"
                        style={{ borderColor: formData.buttonColor }}
                      >
                        <div className="flex items-center gap-2">
                          <p
                            className="text-xl font-bold"
                            style={{ color: formData.buttonColor }}
                          >
                            {formData.buttonText || "Texto del botón"}
                          </p>
                          <span style={{ color: formData.buttonColor }}>→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded">
                💡 <strong>Tip:</strong> Los cambios se reflejan en tiempo real.
              </div>
            </div>
          </div>

          {/* TABS STICKY */}
          <div className="sticky top-[240px] z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-4">
              <button
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
          </div>

          <div className="p-6">
            {/* FORMULARIO */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* TAB: CONTENIDO */}
                {activeTab === "content" && (
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
                        type="url"
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

                {/* TAB: DISEÑO */}
                {activeTab === "design" && (
                  <>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Gradiente de Fondo
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
                      </select>
                    </div>

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
        </div>
      )}

      {/* LISTA DE BANNERS */}
      <div className="grid gap-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4"
          >
            {banner.imageUrl && (
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                width={80}
                height={80}
                className="object-contain"
              />
            )}

            <div className="flex-1">
              <h3 className="font-semibold">{banner.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {banner.subtitle}
              </p>
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <span>
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
