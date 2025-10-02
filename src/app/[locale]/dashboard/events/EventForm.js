"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { translateWithDeepl } from "@/lib/translateDeepl";
import { useTranslations } from "next-intl";
import ImageGalleryManager from "../../components/Articles/ImageGalleryManager/ImageGalleryManager";

// ⚡ Import dinámico para QuillEditor (solo client-side)
const QuillEditor = dynamic(
  () => import("../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);

export default function EventForm({
  initialData = {},
  onSubmit,
  loading = false,
  isEdit = false,
}) {
  const [title, setTitle] = useState(initialData.title || "");
  const [titleES, setTitleES] = useState(initialData.titleES || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [descriptionES, setDescriptionES] = useState(
    initialData.descriptionES || ""
  );
  const [date, setDate] = useState(initialData.date || "");
  const [time, setTime] = useState(initialData.time || "");
  const [location, setLocation] = useState(initialData.location || "");
  const [gallery, setGallery] = useState(initialData.images || []);

  const descriptionESRef = useRef(null);
  const descriptionDERef = useRef(null);
  const [translatingField, setTranslatingField] = useState(null);

  const t = useTranslations("events.dashboard");

  const handleTranslate = async (from, to, field) => {
    try {
      setTranslatingField(field);

      if (field === "title") {
        if (from === "DE") {
          const tr = await translateWithDeepl(title, "DE", "ES");
          setTitleES(tr);
        } else {
          const tr = await translateWithDeepl(titleES, "ES", "DE");
          setTitle(tr);
        }
      }

      if (field === "description") {
        if (from === "DE") {
          const tr = await translateWithDeepl(description, "DE", "ES");
          setDescriptionES(tr);
          setTimeout(() => {
            descriptionESRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        } else {
          const tr = await translateWithDeepl(descriptionES, "ES", "DE");
          setDescription(tr);
          setTimeout(() => {
            descriptionDERef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
      }
    } finally {
      setTranslatingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 convertir archivos locales en dataURL
    const processedGallery = await Promise.all(
      gallery.map(async (img) => {
        if (img.file) {
          const dataUrl = await fileToDataUrl(img.file);
          return { ...img, fileDataUrl: dataUrl };
        }
        return img;
      })
    );

    onSubmit({
      title,
      titleES,
      description,
      descriptionES,
      date,
      time,
      location,
      images: processedGallery,
    });
  };

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const getButtonText = (field, direction) => {
    if (translatingField === field) return "🔄";
    return direction === "ES" ? "⚡ ES" : "⚡ DE";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 🔹 Título DE */}
      <div>
        <label className="block font-semibold mb-1">{t("titleDE")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <button
            type="button"
            onClick={() => handleTranslate("DE", "ES", "title")}
            disabled={loading || !title}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("title", "ES")}
          </button>
        </div>
      </div>

      {/* 🔹 Título ES */}
      <div>
        <label className="block font-semibold mb-1">{t("titleES")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={titleES}
            onChange={(e) => setTitleES(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button
            type="button"
            onClick={() => handleTranslate("ES", "DE", "title")}
            disabled={loading || !titleES}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("title", "DE")}
          </button>
        </div>
      </div>

      {/* 🔹 Descripción DE */}
      <div className="mb-4" ref={descriptionDERef}>
        <div className="flex items-center gap-3 mb-1">
          <label className="font-semibold">{t("descDE")}</label>
          <button
            type="button"
            onClick={() => handleTranslate("DE", "ES", "description")}
            disabled={loading || !description}
            className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("description", "ES")}
          </button>
        </div>
        <div className="border rounded">
          <QuillEditor value={description} onChange={setDescription} />
        </div>
      </div>

      {/* 🔹 Descripción ES */}
      <div className="mb-4" ref={descriptionESRef}>
        <div className="flex items-center gap-3 mb-1">
          <label className="font-semibold">{t("descES")}</label>
          <button
            type="button"
            onClick={() => handleTranslate("ES", "DE", "description")}
            disabled={loading || !descriptionES}
            className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("description", "DE")}
          </button>
        </div>
        <div className="border rounded">
          <QuillEditor value={descriptionES} onChange={setDescriptionES} />
        </div>
      </div>

      {/* 🔹 Fecha */}
      <div>
        <label className="block font-semibold mb-1">{t("date")}</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      {/* 🔹 Hora */}
      <div>
        <label className="block font-semibold mb-1">{t("time")}</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* 🔹 Ubicación */}
      <div>
        <label className="block font-semibold mb-1">{t("location")}</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      {/* 📷 Imágenes */}
      <ImageGalleryManager gallery={gallery} setGallery={setGallery} />

      {/* 🔹 Botón guardar */}
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? t("saving") : isEdit ? t("save") : t("newEvent")}
      </button>
    </form>
  );
}
