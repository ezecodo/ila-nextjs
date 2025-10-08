"use client";

import { useState, useEffect } from "react";
import ImageGalleryManager from "../../components/Articles/ImageGalleryManager/ImageGalleryManager";
import { useTranslations } from "next-intl";
import QuillEditor from "../../components/QuillEditor/QuillEditor";

export default function AdminGiftsPage() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [gallery, setGallery] = useState([]); // ✅ Imagen del premio
  const [newGift, setNewGift] = useState({
    name: "",
    description: "",
  });

  const t = useTranslations("gifts");

  useEffect(() => {
    async function loadGifts() {
      try {
        const res = await fetch("/api/gifts");
        const data = await res.json();
        setGifts(data);
      } catch (err) {
        console.error("Error loading gifts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGifts();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", newGift.name);
    formData.append("description", newGift.description);
    if (gallery[0]?.file) formData.append("image", gallery[0].file);

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setGifts([...gifts, data.gift]);
        setNewGift({ name: "", description: "" });
        setGallery([]);
        setFormVisible(false);
        alert(t("successCreate")); // ✅ mensaje traducido
      } else {
        alert(`${t("errorCreate")}: ${data.error}`);
      }
    } catch (err) {
      console.error("Error creating gift:", err);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ✅ Título principal */}
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* ✅ Botón para abrir/cerrar formulario */}
      <button
        onClick={() => setFormVisible(!formVisible)}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        {formVisible ? t("cancel") : t("addNew")}
      </button>

      {formVisible && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          {/* ✅ Nombre del premio */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("name")}
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={newGift.name}
              onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
              required
            />
          </div>

          {/* ✅ Descripción */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("description")}
            </label>
            <QuillEditor
              value={newGift.description}
              onChange={(value) =>
                setNewGift({ ...newGift, description: value })
              }
            />
          </div>

          {/* ✅ Imagen del premio */}
          <ImageGalleryManager
            gallery={gallery}
            setGallery={setGallery}
            mode="dossier"
          />

          {/* ✅ Botón guardar */}
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            {t("save")}
          </button>
        </form>
      )}

      {/* ✅ Estado de carga o lista */}
      {loading ? (
        <p>{t("loading")}</p>
      ) : gifts.length === 0 ? (
        <p className="text-gray-600">{t("noGifts")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="border rounded-lg p-4 flex flex-col items-center bg-white dark:bg-gray-800 shadow-sm"
            >
              {gift.imageUrl && (
                <img
                  src={gift.imageUrl}
                  alt={gift.name}
                  className="w-40 h-40 object-cover rounded mb-3 border"
                />
              )}
              <h3 className="font-semibold">{gift.name}</h3>
              {gift.description && (
                <p className="text-sm text-gray-600 mt-1">{gift.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
