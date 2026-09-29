"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);
const InterviewEditor = dynamic(
  () => import("../../../components/InterviewEditor/InterviewEditor"),
  { ssr: false }
);

// 🇧🇷 Versión en portugués de un artículo (campos *PT). Carga directa, sin
// el workflow de traductor/revisión del español: se guarda y queda publicada
// (la página pública la ofrece en la barra de idiomas si hay título + cuerpo).
// Mismo patrón que OriginalVersionModal, pero independiente de él.
export default function PortugueseVersionModal({ articleId, onClose, onSaved }) {
  const t = useTranslations("portugueseVersion");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [germanTitle, setGermanTitle] = useState("");
  const [germanSubtitle, setGermanSubtitle] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [translator, setTranslator] = useState("");
  const [images, setImages] = useState([]); // { id, url, title, alt, titlePT, altPT }
  const [inlineImageUrls, setInlineImageUrls] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        const data = await res.json();
        if (cancelled) return;
        setGermanTitle(data.title || "");
        setGermanSubtitle(data.subtitle || "");
        setTitle(data.titlePT || "");
        setSubtitle(data.subtitlePT || "");
        setPreviewText(data.previewTextPT || "");
        setContent(data.contentPT || "");
        setAdditionalInfo(data.additionalInfoPT || "");
        setTranslator(data.translatorPT || "");
        setImages(
          (data.images || []).map((img) => ({
            id: img.id,
            url: img.url,
            title: img.title || "",
            alt: img.alt || "",
            titlePT: img.titlePT || "",
            altPT: img.altPT || "",
          }))
        );
      } catch (err) {
        console.error("Error cargando artículo:", err);
        setMessage(`❌ ${t("loadError")}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId, t]);

  const handleImageChange = (id, field, value) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img))
    );
  };

  // Quill/Publilab vacíos dejan "<p><br></p>": no cuenta como texto.
  const hasText = (html) => !!(html || "").replace(/<[^>]+>/g, "").trim();

  const save = async (clear = false) => {
    if (!clear && hasText(content) && !title.trim()) {
      setMessage(`⚠️ ${t("titleRequired")}`);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const imagesPT = {};
      images.forEach((img) => {
        imagesPT[img.id] = clear
          ? { titlePT: null, altPT: null }
          : { titlePT: img.titlePT, altPT: img.altPT };
      });
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clear
            ? { updatePortugueseVersion: true, imagesPT }
            : {
                updatePortugueseVersion: true,
                titlePT: title,
                subtitlePT: subtitle,
                previewTextPT: hasText(previewText) ? previewText : null,
                contentPT: hasText(content) ? content : null,
                additionalInfoPT: hasText(additionalInfo) ? additionalInfo : null,
                translatorPT: translator,
                imagesPT,
                inlineImageUrls,
              }
        ),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setMessage(`✅ ${clear ? t("removed") : t("saved")}`);
      if (onSaved) onSaved(!!(updated.titlePT && updated.contentPT));
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error("Error guardando versión PT:", err);
      setMessage(`❌ ${t("saveError")}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (window.confirm(t("confirmRemove"))) save(true);
  };

  const label = "block text-sm font-semibold text-gray-700 mb-1";
  const input = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
  const reference = "mt-1 text-xs text-gray-400";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">
            🇧🇷 {t("modalTitle", { id: articleId })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label={t("cancel")}
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{t("intro")}</p>

        {loading ? (
          <div className="py-16 text-center text-gray-400">{t("loading")}</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={label}>{t("title")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={input}
              />
              {germanTitle && (
                <p className={reference}>DE: {germanTitle}</p>
              )}
            </div>

            <div>
              <label className={label}>{t("subtitle")}</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className={input}
              />
              {germanSubtitle && (
                <p className={reference}>DE: {germanSubtitle}</p>
              )}
            </div>

            <div>
              <label className={label}>{t("previewText")}</label>
              <QuillEditor value={previewText} onChange={setPreviewText} />
            </div>

            <div>
              <label className={label}>{t("content")}</label>
              <InterviewEditor
                value={content}
                onChange={setContent}
                onUrlInserted={(url) =>
                  setInlineImageUrls((prev) => [...prev, url])
                }
                title={title}
                subtitle={subtitle}
                articleId={articleId}
              />
            </div>

            <div>
              <label className={label}>{t("additionalInfo")}</label>
              <p className="text-xs text-gray-400 mb-1">{t("additionalInfoHint")}</p>
              <QuillEditor value={additionalInfo} onChange={setAdditionalInfo} />
            </div>

            <div>
              <label className={label}>{t("translator")}</label>
              <input
                type="text"
                value={translator}
                onChange={(e) => setTranslator(e.target.value)}
                placeholder={t("translatorPlaceholder")}
                className={input}
              />
              <p className={reference}>{t("translatorHint")}</p>
            </div>

            {images.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  {t("imagesTitle")}
                </p>
                {images.map((img) => (
                  <div key={img.id} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.title || ""}
                      className="w-16 h-16 object-cover rounded border shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={img.titlePT}
                        onChange={(e) => handleImageChange(img.id, "titlePT", e.target.value)}
                        placeholder={t("imageCaption")}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                      {img.title && <p className="text-[11px] text-gray-400">DE: {img.title}</p>}
                      <input
                        type="text"
                        value={img.altPT}
                        onChange={(e) => handleImageChange(img.id, "altPT", e.target.value)}
                        placeholder={t("imageAlt")}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                      {img.alt && <p className="text-[11px] text-gray-400">DE: {img.alt}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {message && <p className="text-sm">{message}</p>}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleRemove}
                disabled={saving}
                className="px-3 py-2 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
              >
                🗑 {t("remove")}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => save(false)}
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-[#BD0E0D] hover:bg-[#a50c0b] text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {saving ? t("saving") : `💾 ${t("save")}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
