"use client";

import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";

export default function RedaktionTeamForm({
  onSubmit,
  newMember,
  setNewMember,
  gallery,
  setGallery,
  t,
  editingMember,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
    >
      <div>
        <label className="block text-sm font-medium mb-1">{t("name")}</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={newMember.name}
          onChange={(e) =>
            setNewMember((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("bioDE")}
        </label>
        <textarea
          className="w-full p-2 border rounded min-h-[120px]"
          value={newMember.bio || ""}
          onChange={(e) =>
            setNewMember((prev) => ({ ...prev, bio: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("bioES")}
        </label>
        <textarea
          className="w-full p-2 border rounded min-h-[120px]"
          value={newMember.bioES || ""}
          onChange={(e) =>
            setNewMember((prev) => ({ ...prev, bioES: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("order")}
        </label>
        <input
          type="number"
          className="w-32 p-2 border rounded"
          value={newMember.order ?? 0}
          onChange={(e) =>
            setNewMember((prev) => ({ ...prev, order: e.target.value }))
          }
        />
        <p className="text-xs text-gray-500 mt-1">{t("orderHint")}</p>
      </div>

      {/* ✅ Foto — opcional */}
      <ImageGalleryManager gallery={gallery} setGallery={setGallery} mode="dossier" />

      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        {editingMember ? t("update") : t("save")}
      </button>
    </form>
  );
}
