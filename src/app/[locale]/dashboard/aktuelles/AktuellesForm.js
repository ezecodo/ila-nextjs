"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { translateWithDeepl } from "@/lib/translateDeepl";
import { useTranslations } from "next-intl";
import ImageGalleryManager from "../../components/Articles/ImageGalleryManager/ImageGalleryManager";

// ⚡ Import dinámico para que QuillEditor funcione solo en el cliente
const QuillEditor = dynamic(
  () => import("../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);

export default function AktuellesForm({
  initialData = {},
  onSubmit,
  loading = false,
  isEdit = false,
}) {
  const [title, setTitle] = useState(initialData.title || "");
  const [titleES, setTitleES] = useState(initialData.titleES || "");
  const [subtitle, setSubtitle] = useState(initialData.subtitle || "");
  const [subtitleES, setSubtitleES] = useState(initialData.subtitleES || "");
  const [content, setContent] = useState(initialData.content || "");
  const [contentES, setContentES] = useState(initialData.contentES || "");
  const [gallery, setGallery] = useState(initialData.images || []);
  const contentESRef = useRef(null);
  const contentDERef = useRef(null);
  const [translatingField, setTranslatingField] = useState(null);
  const t = useTranslations("dashboard.Aktuelles");

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
      if (field === "subtitle") {
        if (from === "DE") {
          const tr = await translateWithDeepl(subtitle, "DE", "ES");
          setSubtitleES(tr);
        } else {
          const tr = await translateWithDeepl(subtitleES, "ES", "DE");
          setSubtitle(tr);
        }
      }
      if (field === "content") {
        if (from === "DE") {
          const tr = await translateWithDeepl(content, "DE", "ES");
          setContentES(tr);

          setTimeout(() => {
            contentESRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        } else {
          const tr = await translateWithDeepl(contentES, "ES", "DE");
          setContent(tr);

          setTimeout(() => {
            contentDERef.current?.scrollIntoView({
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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("titleES", titleES);
    formData.append("subtitle", subtitle || "");
    formData.append("subtitleES", subtitleES || "");
    formData.append("content", content);
    formData.append("contentES", contentES);

    // Imágenes nuevas (con File) y existentes (con id)
    const keepImageIds = [];
    gallery.forEach((img, idx) => {
      if (img.file) {
        formData.append(`images[${idx}][file]`, img.file);
        formData.append(`images[${idx}][title]`, img.title || "");
        formData.append(`images[${idx}][alt]`, img.alt || "");
      } else if (img.id) {
        keepImageIds.push(img.id);
        formData.append(`images[${idx}][id]`, img.id);
        formData.append(`images[${idx}][title]`, img.title || "");
        formData.append(`images[${idx}][alt]`, img.alt || "");
      }
    });
    formData.append("keepImageIds", JSON.stringify(keepImageIds));

    onSubmit(formData);
  };

  const getButtonText = (field, direction) => {
    if (translatingField === field) return "🔄";
    return direction === "ES" ? "⚡ ES" : "⚡ DE";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título DE */}
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

      {/* Título ES */}
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

      {/* Subtítulo DE */}
      <div>
        <label className="block font-semibold mb-1">{t("subtitleDE")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button
            type="button"
            onClick={() => handleTranslate("DE", "ES", "subtitle")}
            disabled={loading || !subtitle}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("subtitle", "ES")}
          </button>
        </div>
      </div>

      {/* Subtítulo ES */}
      <div>
        <label className="block font-semibold mb-1">{t("subtitleES")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={subtitleES}
            onChange={(e) => setSubtitleES(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button
            type="button"
            onClick={() => handleTranslate("ES", "DE", "subtitle")}
            disabled={loading || !subtitleES}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("subtitle", "DE")}
          </button>
        </div>
      </div>

      {/* Contenido DE */}
      <div className="mb-4" ref={contentDERef}>
        <div className="flex items-center gap-3 mb-1">
          <label className="font-semibold">{t("contentDE")}</label>
          <button
            type="button"
            onClick={() => handleTranslate("DE", "ES", "content")}
            disabled={loading || !content}
            className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("content", "ES")}
          </button>
        </div>
        <div className="border rounded">
          <QuillEditor value={content} onChange={setContent} />
        </div>
      </div>

      {/* Contenido ES */}
      <div className="mb-4" ref={contentESRef}>
        <div className="flex items-center gap-3 mb-1">
          <label className="font-semibold">{t("contentES")}</label>
          <button
            type="button"
            onClick={() => handleTranslate("ES", "DE", "content")}
            disabled={loading || !contentES}
            className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {getButtonText("content", "DE")}
          </button>
        </div>
        <div className="border rounded">
          <QuillEditor value={contentES} onChange={setContentES} />
        </div>
      </div>
      {/* 📷 Imagenes */}
      {/* 📷 Imágenes */}
      <ImageGalleryManager gallery={gallery} setGallery={setGallery} />
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading
          ? t("saving")
          : isEdit
            ? t("saveButtonEdit")
            : t("saveButtonCreate")}
      </button>
    </form>
  );
}
