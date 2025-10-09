"use client";

import QuillEditor from "../../../components/QuillEditor/QuillEditor";
import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";

export default function GiftForm({
  onSubmit,
  newGift,
  setNewGift,
  gallery,
  setGallery,
  t,
  editingGift,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
    >
      {/* 🔹 Nombre y subtítulo (DE) */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("nameDE")}</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={newGift.name}
          onChange={(e) =>
            setNewGift((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("subtitleDE")}
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={newGift.subtitle || ""}
          onChange={(e) =>
            setNewGift((prev) => ({ ...prev, subtitle: e.target.value }))
          }
        />
      </div>

      {/* 🔹 Descripción (DE) */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("descriptionDE")}
        </label>
        <QuillEditor
          value={newGift.description}
          onChange={(value) =>
            setNewGift((prev) => ({ ...prev, description: value }))
          }
        />
      </div>

      <hr className="my-4 border-gray-400/40" />

      {/* 🇪🇸 Versión en Español */}
      <h2 className="text-lg font-semibold mb-2">{t("spanishVersion")}</h2>

      <div>
        <label className="block text-sm font-medium mb-1">{t("nameES")}</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={newGift.nameES || ""}
          onChange={(e) =>
            setNewGift((prev) => ({ ...prev, nameES: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("subtitleES")}
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={newGift.subtitleES || ""}
          onChange={(e) =>
            setNewGift((prev) => ({ ...prev, subtitleES: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("descriptionES")}
        </label>
        <QuillEditor
          value={newGift.descriptionES || ""}
          onChange={(value) =>
            setNewGift((prev) => ({ ...prev, descriptionES: value }))
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
        {editingGift ? t("update") : t("save")}
      </button>
    </form>
  );
}
