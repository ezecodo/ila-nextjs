// app/[locale]/dashboard/banners/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      startDate: "",
      endDate: "",
      isActive: true,
      position: "top",
    });
    setEditingId(null);
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Editar Banner" : "Nuevo Banner"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título (DE)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Título (ES)
                </label>
                <input
                  type="text"
                  value={formData.titleEs}
                  onChange={(e) =>
                    setFormData({ ...formData, titleEs: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subtítulo (DE)
                </label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subtítulo (ES)
                </label>
                <textarea
                  value={formData.subtitleEs}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitleEs: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descripción (DE)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  rows={3}
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
                    setFormData({ ...formData, descriptionEs: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Texto del Botón (DE)
                </label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonText: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
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
                    setFormData({ ...formData, buttonTextEs: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URL del Botón
              </label>
              <input
                type="url"
                value={formData.buttonUrl}
                onChange={(e) =>
                  setFormData({ ...formData, buttonUrl: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Imagen</label>
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Posición
                </label>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded"
              />
              <span>Activo</span>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {editingId ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

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
