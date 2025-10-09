"use client";

import { useState, useEffect } from "react";
import GiftForm from "../components/GiftsForm/GiftsForm";
import { useTranslations, useLocale } from "next-intl";
import { FaPlus, FaTimes, FaEdit, FaGift, FaImage } from "react-icons/fa";

export default function AdminGiftsPage() {
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

    // 1. Declarar FormData primero
    const formData = new FormData();

    // 2. Agregar el ID y la URL actual (si estamos editando)
    if (editingGift) {
      // Necesario para que la API sepa que es una ACTUALIZACIÓN
      formData.append("id", editingGift.id);
      // Pasa la imagen actual para que la API la use si NO se sube una nueva
      formData.append("currentImageUrl", editingGift.imageUrl || "");
    }

    // 3. Agregar todos los campos de texto
    formData.append("name", newGift.name);
    formData.append("subtitle", newGift.subtitle || "");
    formData.append("description", newGift.description || "");
    formData.append("nameES", newGift.nameES || "");
    formData.append("subtitleES", newGift.subtitleES || "");
    formData.append("descriptionES", newGift.descriptionES || "");
    // La API puede calcular si está traducido, pero si lo envías, no hay problema
    formData.append("isTranslatedES", newGift.nameES ? "true" : "false");

    // 4. Agregar el archivo de imagen (si existe)
    if (gallery[0]?.file) {
      formData.append("image", gallery[0].file);
    }

    try {
      // 5. Siempre usamos POST. La API se encargará de decidir si es CREATE o UPDATE
      // usando el ID del formData.
      const res = await fetch("/api/gifts", {
        method: "POST",
        body: formData,
        // ✅ SOLUCIÓN: Usar la opción 'revalidate: 0' para evitar la interferencia de Next.js
        // Esto le dice a Next.js que trate esta llamada como una mutación pura,
        // evitando que intente serializarla como un payload RSC.
        next: {
          revalidate: 0,
        },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header Section con Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaGift className="text-white text-xl" />
                </div>
                {t("title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t("subtitle") ||
                  "Gestiona los premios disponibles para suscriptores"}
              </p>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {gifts.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("totalGifts") || "Premios disponibles"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
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
            className={`
              w-full md:w-auto px-6 py-3 rounded-xl font-semibold
              flex items-center justify-center gap-2
              transition-all duration-200 shadow-lg hover:shadow-xl
              ${
                formVisible
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              }
            `}
          >
            {formVisible ? (
              <>
                <FaTimes /> {t("cancel")}
              </>
            ) : (
              <>
                <FaPlus /> {t("addNew")}
              </>
            )}
          </button>
        </div>

        {/* Form Section */}
        {formVisible && (
          <div className="mb-8 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                {editingGift ? (
                  <>
                    <FaEdit className="text-blue-600" />
                    {t("editing") || "Editando Premio"}
                  </>
                ) : (
                  <>
                    <FaPlus className="text-red-600" />
                    {t("addNew")}
                  </>
                )}
              </h2>
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
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
          </div>
        ) : gifts.length === 0 ? (
          // Empty State
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGift className="text-5xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                {t("noGifts")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("noGiftsDescription") ||
                  "Comienza agregando el primer premio para tus suscriptores"}
              </p>
              <button
                onClick={() => setFormVisible(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all shadow-lg hover:shadow-xl"
              >
                <FaPlus /> {t("addFirstGift") || "Agregar primer premio"}
              </button>
            </div>
          </div>
        ) : (
          // Gifts Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift) => {
              const name =
                locale === "es" && gift.isTranslatedES
                  ? gift.nameES || gift.name
                  : gift.name;
              const subtitle =
                locale === "es" && gift.isTranslatedES
                  ? gift.subtitleES || gift.subtitle
                  : gift.subtitle;
              const description =
                locale === "es" && gift.isTranslatedES
                  ? gift.descriptionES || gift.description
                  : gift.description;

              return (
                <div
                  key={gift.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-600"
                >
                  {/* Image Section */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                    {gift.imageUrl ? (
                      <img
                        src={gift.imageUrl}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaImage className="text-6xl text-gray-400 dark:text-gray-500" />
                      </div>
                    )}

                    {/* Edit Button Overlay */}
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
                      className="absolute top-3 right-3 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white dark:hover:bg-red-600"
                    >
                      <FaEdit className="text-lg" />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {name}
                    </h3>

                    {subtitle && (
                      <p className="text-sm italic text-red-600 dark:text-red-400 mb-3 line-clamp-1">
                        {subtitle}
                      </p>
                    )}

                    {description && (
                      <div
                        className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
