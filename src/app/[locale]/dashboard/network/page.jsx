// app/[locale]/admin/network/page.jsx
"use client";

import { useState, useEffect } from "react";

import Image from "next/image";

export default function AdminNetworkPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    nameEs: "",
    description: "",
    descriptionEs: "",
    url: "",
    logoUrl: "",
    logoWidth: null,
    logoHeight: null,
    order: 0,
    active: true,
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/network");
      const data = await res.json();
      setPartners(data);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/network/${editingId}` : "/api/network";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logoWidth: formData.logoWidth || null,
          logoHeight: formData.logoHeight || null,
        }),
      });

      if (res.ok) {
        await fetchPartners();
        resetForm();
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error saving partner:", error);
    }
  };

  const handleEdit = (partner) => {
    setFormData({
      name: partner.name,
      nameEs: partner.nameEs || "",
      description: partner.description || "",
      descriptionEs: partner.descriptionEs || "",
      url: partner.url,
      logoUrl: partner.logoUrl || "",
      order: partner.order,
      active: partner.active,
    });
    setEditingId(partner.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar esta organización?")) return;

    try {
      const res = await fetch(`/api/network/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchPartners();
      }
    } catch (error) {
      console.error("Error deleting partner:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameEs: "",
      description: "",
      descriptionEs: "",
      url: "",
      logoUrl: "",
      logoWidth: null,
      logoHeight: null,
      order: 0,
      active: true,
    });
    setEditingId(null);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("folder", "network-logos");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (data.url) {
        setFormData((prev) => ({
          ...prev,
          logoUrl: data.url,
          logoWidth: data.width,
          logoHeight: data.height,
        }));
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Error al subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Red de Colaboración</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {showForm ? "Cancelar" : "Nueva Organización"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Editar Organización" : "Nueva Organización"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre (DE)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre (ES)
                </label>
                <input
                  type="text"
                  value={formData.nameEs}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEs: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
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

            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="flex-1 px-3 py-2 border rounded dark:bg-gray-700"
                  disabled={uploadingLogo}
                />
                {uploadingLogo && <span>Subiendo...</span>}
                {formData.logoUrl && (
                  <Image
                    src={formData.logoUrl}
                    alt="Preview"
                    width={80}
                    height={60}
                    className="object-contain bg-white p-2 rounded border"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Orden</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span>Activo</span>
                </label>
              </div>
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
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4"
          >
            {partner.logoUrl && (
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={120}
                height={80}
                className="object-contain bg-white p-2 rounded"
              />
            )}

            <div className="flex-1">
              <h3 className="font-semibold">{partner.name}</h3>
              {partner.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {partner.description}
                </p>
              )}
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-600 hover:underline"
              >
                {partner.url}
              </a>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(partner)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(partner.id)}
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
