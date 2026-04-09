"use client";

import { useRef, useState, useEffect, useCallback } from "react";

const SIZE_PRESETS = [
  { label: "S", value: "25" },
  { label: "M", value: "50" },
  { label: "L", value: "75" },
  { label: "■", value: "100" },
];

function SizeButtons({ current, onChange }) {
  return (
    <div className="flex gap-1 items-center">
      <span className="text-xs text-gray-400 mr-0.5">Größe:</span>
      {SIZE_PRESETS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
            current === value
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function getWidthFromStyle(styleStr) {
  const m = (styleStr || "").match(/width:\s*(\d+)%/);
  return m ? m[1] : "100";
}

export default function InlineImageInserter({
  quillInstanceRef,
  onUrlInserted,
  onContentChange,
  articleId,
  quillReady,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [altText, setAltText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [pendingSize, setPendingSize] = useState("100");

  // Existing images in the editor
  const [existingImages, setExistingImages] = useState([]);
  const [editValues, setEditValues] = useState({}); // {[src]: {alt, title, width}}

  const scanImages = useCallback(() => {
    const quill = quillInstanceRef.current;
    if (!quill) return;
    const imgs = Array.from(quill.root.querySelectorAll("img"));
    const data = imgs.map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      title: img.getAttribute("title") || "",
      width: getWidthFromStyle(img.getAttribute("style")),
    }));
    setExistingImages(data);
    setEditValues((prev) => {
      const next = { ...prev };
      data.forEach(({ src, alt, title, width }) => {
        if (!(src in next)) next[src] = { alt, title, width };
      });
      const activeSrcs = new Set(data.map((d) => d.src));
      Object.keys(next).forEach((src) => {
        if (!activeSrcs.has(src)) delete next[src];
      });
      return next;
    });
  }, [quillInstanceRef]);

  useEffect(() => {
    if (!quillReady) return;
    const quill = quillInstanceRef.current;
    if (!quill) return;
    scanImages();
    quill.on("text-change", scanImages);
    return () => quill.off("text-change", scanImages);
  }, [quillReady, scanImages]);

  const applyAttrsToImg = (quill, src, { alt, title, width }) => {
    const imgs = quill.root.querySelectorAll(`img[src="${src}"]`);
    const img = imgs[imgs.length - 1];
    if (!img) return;
    if (alt !== undefined) img.setAttribute("alt", alt);
    if (title !== undefined) img.setAttribute("title", title);
    if (width) {
      img.style.width = `${width}%`;
      img.style.height = "auto";
    }
    if (onContentChange) onContentChange(quill.root.innerHTML);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicId = articleId
        ? `article_inline_${articleId}_${Date.now()}`
        : `article_inline_${Date.now()}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ila/articles");
      formData.append("customPublicId", publicId);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setPendingUrl(data.url);
        setAltText("");
        setTitleText("");
        setPendingSize("100");
      }
    } catch (err) {
      console.error("Inline image upload error:", err);
      alert("Fehler beim Hochladen des Bildes.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleInsert = () => {
    if (!pendingUrl || !quillInstanceRef.current) return;
    const quill = quillInstanceRef.current;
    const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };

    quill.insertEmbed(range.index, "image", pendingUrl, "user");
    quill.setSelection(range.index + 1, 0, "silent");

    setTimeout(() => {
      applyAttrsToImg(quill, pendingUrl, {
        alt: altText,
        title: titleText,
        width: pendingSize,
      });
    }, 30);

    if (onUrlInserted) onUrlInserted(pendingUrl);
    setPendingUrl(null);
    setAltText("");
    setTitleText("");
    setPendingSize("100");
  };

  const handleCancel = () => {
    setPendingUrl(null);
    setAltText("");
    setTitleText("");
    setPendingSize("100");
  };

  const handleUpdateImage = (src) => {
    const quill = quillInstanceRef.current;
    if (!quill) return;
    applyAttrsToImg(quill, src, editValues[src] || {});
  };

  const handleResizeImage = (src, widthValue) => {
    setEditValues((prev) => ({
      ...prev,
      [src]: { ...prev[src], width: widthValue },
    }));
    const quill = quillInstanceRef.current;
    if (!quill) return;
    const imgs = quill.root.querySelectorAll(`img[src="${src}"]`);
    const img = imgs[imgs.length - 1];
    if (!img) return;
    img.style.width = `${widthValue}%`;
    img.style.height = "auto";
    if (onContentChange) onContentChange(quill.root.innerHTML);
  };

  return (
    <div className="mt-1 mb-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {!pendingUrl ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📷 {uploading ? "Lädt hoch…" : "Bild einfügen"}
          </button>
          <span className="text-xs text-gray-400">
            Wird an der Cursorposition eingefügt
          </span>
        </div>
      ) : (
        <div className="border border-blue-200 bg-blue-50 rounded p-3 flex flex-col gap-2">
          <div className="flex gap-3 items-start">
            <img
              src={pendingUrl}
              alt="preview"
              className="h-16 object-cover rounded border flex-shrink-0"
              style={{ width: `${Math.max(40, (parseInt(pendingSize) / 100) * 160)}px` }}
            />
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Credit / Bildunterschrift (wird unter dem Bild angezeigt)"
                className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                placeholder="Bildnachweis / Credit (optional)"
                className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <SizeButtons current={pendingSize} onChange={setPendingSize} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              ✓ Einfügen
            </button>
          </div>
        </div>
      )}

      {/* Existing inline images — edit alt / credit / size */}
      {existingImages.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-200 bg-gray-50">
            Eingefügte Bilder bearbeiten
          </p>
          <div className="divide-y divide-gray-100">
            {existingImages.map((img) => (
              <div key={img.src} className="flex gap-3 items-start px-3 py-2">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-14 h-10 object-cover rounded border flex-shrink-0 mt-1"
                />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <input
                    type="text"
                    value={editValues[img.src]?.alt ?? img.alt}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        [img.src]: { ...prev[img.src], alt: e.target.value },
                      }))
                    }
                    onBlur={() => handleUpdateImage(img.src)}
                    placeholder="Alt-Text / Bildunterschrift"
                    className="border rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    value={editValues[img.src]?.title ?? img.title}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        [img.src]: { ...prev[img.src], title: e.target.value },
                      }))
                    }
                    onBlur={() => handleUpdateImage(img.src)}
                    placeholder="Bildnachweis / Credit"
                    className="border rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <SizeButtons
                    current={editValues[img.src]?.width ?? img.width}
                    onChange={(val) => handleResizeImage(img.src, val)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
