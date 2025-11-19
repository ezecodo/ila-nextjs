"use client";

import { useState, useEffect } from "react";
import GiftForm from "../GiftsForm/GiftsForm";
import { useTranslations, useLocale } from "next-intl";
import { FaPlus, FaTimes, FaEdit, FaGift, FaImage } from "react-icons/fa";

export default function GiftsManager() {
  const [gifts, setGifts] = useState([]);
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [editingGift, setEditingGift] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [newGift, setNewGift] = useState({
    name: "",
    subtitle: "",
    description: "",
    nameES: "",
    subtitleES: "",
    descriptionES: "",
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
    if (editingGift) {
      formData.append("id", editingGift.id);
      formData.append("currentImageUrl", editingGift.imageUrl || "");
    }

    formData.append("name", newGift.name);
    formData.append("subtitle", newGift.subtitle || "");
    formData.append("description", newGift.description || "");
    formData.append("nameES", newGift.nameES || "");
    formData.append("subtitleES", newGift.subtitleES || "");
    formData.append("descriptionES", newGift.descriptionES || "");
    formData.append("isTranslatedES", newGift.nameES ? "true" : "false");

    if (gallery[0]?.file) {
      formData.append("image", gallery[0].file);
    }

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        body: formData,
        next: { revalidate: 0 },
      });

      const data = await res.json();

      if (data.success) {
        if (editingGift) {
          setGifts((prev) =>
            prev.map((g) => (g.id === editingGift.id ? data.gift : g))
          );
          setEditingGift(null);
          alert(t("updatedSuccess"));
        } else {
          setGifts([...gifts, data.gift]);
          alert(t("successCreate"));
        }

        setNewGift({
          name: "",
          subtitle: "",
          description: "",
          nameES: "",
          subtitleES: "",
          descriptionES: "",
        });
        setGallery([]);
        setFormVisible(false);
      } else {
        alert(`${t("errorCreate")}: ${data.error}`);
      }
    } catch (err) {
      console.error("Error saving gift:", err);
      alert(t("generalError") || "Ocurrió un error al guardar el premio.");
    }
  }
  async function handleDeactivate(id) {
    if (!confirm("¿Marcar este premio como agotado?")) return;

    try {
      const res = await fetch(`/api/gifts?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        // 🔥 No lo quitamos del array completamente (solo si isActive false)
        setGifts((prev) =>
          prev.map((g) => (g.id === id ? { ...g, isActive: false } : g))
        );
        alert("Premio marcado como agotado");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Error deactivating gift:", err);
      alert("No se pudo marcar como agotado");
    }
  }

  const isSpanish = locale === "es";

  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FaGift className="text-red-500" /> {t("title")}
        </h1>
        <button
          onClick={() => {
            setFormVisible(!formVisible);
            if (formVisible) {
              setEditingGift(null);
              setNewGift({
                name: "",
                subtitle: "",
                description: "",
                nameES: "",
                subtitleES: "",
                descriptionES: "",
              });
              setGallery([]);
            }
          }}
          className={`px-4 py-2 rounded-lg ${
            formVisible
              ? "bg-gray-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {formVisible ? <FaTimes /> : <FaPlus />}
        </button>
      </div>

      {/* Form */}
      {formVisible && (
        <div className="mb-6">
          <GiftForm
            onSubmit={handleSubmit}
            newGift={newGift}
            setNewGift={setNewGift}
            gallery={gallery}
            setGallery={setGallery}
            t={t}
            editingGift={editingGift}
          />
        </div>
      )}

      {/* Lista de premios */}
      {loading ? (
        <p>{t("loading")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift) => {
            const name =
              isSpanish && gift.isTranslatedES
                ? gift.nameES || gift.name
                : gift.name;
            const subtitle =
              isSpanish && gift.isTranslatedES
                ? gift.subtitleES || gift.subtitle
                : gift.subtitle;
            const description =
              isSpanish && gift.isTranslatedES
                ? gift.descriptionES || gift.description
                : gift.description;

            return (
              <div
                key={gift.id}
                className="border rounded-lg shadow p-4 flex flex-col items-center bg-white dark:bg-gray-800"
              >
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt={name}
                    className="w-32 h-32 object-cover rounded mb-3"
                  />
                ) : (
                  <FaImage className="text-6xl text-gray-400 mb-3" />
                )}
                <h3 className="font-bold text-center">{name}</h3>
                {gift.isActive === false && (
                  <span className="mt-2 text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded">
                    🟡 Agotado (oculto públicamente)
                  </span>
                )}
                {subtitle && (
                  <p className="italic text-sm text-gray-500">{subtitle}</p>
                )}
                {description && (
                  <div
                    className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                )}
                <button
                  onClick={() => {
                    setEditingGift(gift);
                    setNewGift({
                      name: gift.name || "",
                      subtitle: gift.subtitle || "",
                      description: gift.description || "",
                      nameES: gift.nameES || "",
                      subtitleES: gift.subtitleES || "",
                      descriptionES: gift.descriptionES || "",
                    });
                    setFormVisible(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <FaEdit className="inline mr-1" /> {t("edit")}
                </button>
                <button
                  onClick={() => handleDeactivate(gift.id)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <FaTimes className="inline mr-1" /> Marcar como agotado
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
