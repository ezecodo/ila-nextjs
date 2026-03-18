"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Copy } from "lucide-react";
function stripHtml(html) {
  if (!html) return "";
  // Sustituir <br> por salto de línea
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  // Sustituir </p> por doble salto de línea
  text = text.replace(/<\/p>/gi, "\n\n");
  // Eliminar todas las demás etiquetas
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.body.textContent || "";
}

function InlineImageWidget({ images, imageTranslations, onInsert, compact = false }) {
  return (
    <div className={compact ? "" : "mt-3 border border-green-200 rounded bg-green-50 p-2"}>
      {!compact && (
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
          Inline-Bilder aus dem deutschen Artikel — klicken zum Einfügen an Cursorposition
        </p>
      )}
      {compact && (
        <p className="text-xs font-semibold text-green-700 mb-1">
          Bild einfügen — Cursor im Text positionieren, dann Bild wählen:
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {images.map((img) => {
          const credit = imageTranslations[img.id]?.titleES || img.title || imageTranslations[img.id]?.altES || img.alt || "";
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onInsert(img)}
              className="flex flex-col items-center gap-1 p-1 border border-green-300 rounded hover:border-green-500 hover:bg-green-100 transition-colors group"
              title="Klicken zum Einfügen"
            >
              <img
                src={img.url}
                alt={img.alt || ""}
                className="w-16 h-12 object-cover rounded"
              />
              {credit && (
                <span className="text-xs text-gray-500 max-w-[4rem] truncate">{credit}</span>
              )}
              <span className="text-xs text-green-700 font-semibold group-hover:text-green-900">+ einfügen</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TranslateArticlePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [translations, setTranslations] = useState({
    titleES: "",
    subtitleES: "",
    previewES: "",
    contentES: "",
    additionalInfoES: "",
  });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const contentEditableRef = useRef(null);
  const contentEditableModalRef = useRef(null);
  const [deepl, setDeepl] = useState(null); // { titleES, subtitleES, previewTextES, contentES, additionalInfoES }
  const [deeplLoading, setDeeplLoading] = useState(false);
  const [deeplError, setDeeplError] = useState("");
  const [images, setImages] = useState([]);
  const [inlineImages, setInlineImages] = useState([]);
  const [imageTranslations, setImageTranslations] = useState({});
  const savedRangeRef = useRef(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const res = await fetch(`/api/articles/${id}`);
      const data = await res.json();
      setArticle(data);
      setTranslations({
        titleES: data.titleES || "",
        subtitleES: data.subtitleES || "",
        previewES: data.previewTextES || "",
        contentES: data.contentES || "",
        additionalInfoES: data.additionalInfoES || "",
      });

      // 🖼️ Cargar imágenes de galería
      const imgTrans = {};
      if (data.images && data.images.length > 0) {
        setImages(data.images);
        data.images.forEach((img) => {
          imgTrans[img.id] = {
            altES: img.altES || "",
            titleES: img.titleES || "",
          };
        });
      }
      // 🖼️ Cargar imágenes inline
      if (data.inlineImages && data.inlineImages.length > 0) {
        setInlineImages(data.inlineImages);
        data.inlineImages.forEach((img) => {
          imgTrans[img.id] = {
            altES: img.altES || "",
            titleES: img.titleES || "",
          };
        });
      }
      if (Object.keys(imgTrans).length > 0) setImageTranslations(imgTrans);
    };
    fetchArticle();
  }, [id]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsReviewMode(params.get("mode") === "review");
  }, []);

  // Sincroniza contentES con el div editable solo cuando cambia externamente (DeepL / carga)
  useEffect(() => {
    [contentEditableRef, contentEditableModalRef].forEach((ref) => {
      if (!ref.current) return;
      if (ref.current.innerHTML !== (translations.contentES || "")) {
        ref.current.innerHTML = translations.contentES || "";
      }
    });
  }, [translations.contentES]);

  // Cerrar modal con Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setIsContentModalOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Al abrir el modal, sincronizar el contenido al div editable del modal
  useEffect(() => {
    if (!isContentModalOpen) return;
    setTimeout(() => {
      if (contentEditableModalRef.current) {
        contentEditableModalRef.current.innerHTML = translations.contentES || "";
      }
    }, 0);
  }, [isContentModalOpen]);

  const handleChange = (e) => {
    setTranslations({
      ...translations,
      [e.target.name]: e.target.value,
    });
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const insertInlineImageAtCursor = (img) => {
    const targetRef = isContentModalOpen ? contentEditableModalRef : contentEditableRef;
    if (!targetRef.current) return;

    const altES = imageTranslations[img.id]?.altES || img.alt || "";
    const titleES = imageTranslations[img.id]?.titleES || img.title || "";

    const p = document.createElement("p");
    const imgEl = document.createElement("img");
    imgEl.src = img.url;
    if (altES) imgEl.setAttribute("alt", altES);
    if (titleES) imgEl.setAttribute("title", titleES);
    if (img.style) imgEl.setAttribute("style", img.style);
    p.appendChild(imgEl);

    const range = savedRangeRef.current;
    const sel = window.getSelection();

    if (range && targetRef.current.contains(range.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(range);
      range.deleteContents();
      range.insertNode(p);
      range.setStartAfter(p);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      targetRef.current.appendChild(p);
    }

    const html = targetRef.current.innerHTML;
    setTranslations((prev) => ({ ...prev, contentES: html }));
  };

  if (!article) {
    return <div className="p-6 text-gray-600">⏳ Cargando artículo...</div>;
  }
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("📋 Copiado al portapapeles:", text);
    });
  };
  // Llama a tu endpoint backend y cachea el resultado en estado
  const fetchDeepl = async () => {
    if (deepl) return deepl; // ya cargado
    try {
      setDeeplLoading(true);
      setDeeplError("");
      const res = await fetch("/api/translate/deepl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json(); // { translations: {...}, imageTranslations: {...} }
      setDeepl(data);
      return data;
    } catch (e) {
      setDeeplError(e.message || "DeepL error");
      alert(`❌ DeepL: ${e.message || "Error desconocido"}`);
      return null;
    } finally {
      setDeeplLoading(false);
    }
  };

  // Rellena TODO el formulario con lo de DeepL (solo vacíos, no pisa lo escrito)
  const fillAllFromDeepl = async () => {
    const tr = await fetchDeepl();
    if (!tr) return;
    setTranslations((prev) => ({
      ...prev,
      titleES: prev.titleES || tr.translations.titleES || "",
      subtitleES: prev.subtitleES || tr.translations.subtitleES || "",
      previewES:
        prev.previewES || stripHtml(tr.translations.previewTextES) || "",
      contentES: prev.contentES || tr.translations.contentES || "",
      additionalInfoES:
        prev.additionalInfoES ||
        stripHtml(tr.translations.additionalInfoES) ||
        "",
    }));

    // 🖼️ Rellenar traducciones de imágenes
    if (tr.imageTranslations) {
      setImageTranslations((prev) => {
        const updated = { ...prev };
        for (const [imgId, trans] of Object.entries(tr.imageTranslations)) {
          updated[imgId] = {
            titleES: prev[imgId]?.titleES || trans.titleES || "",
            altES: prev[imgId]?.altES || trans.altES || "",
          };
        }
        return updated;
      });
    }
  };

  // Rellena solo un campo concreto (opcionalmente forzar pisado)
  const fillFieldFromDeepl = async (
    stateKey,
    deeplKey,
    { force = false } = {},
  ) => {
    const tr = await fetchDeepl();
    if (!tr) return;
    setTranslations((prev) => {
      if (!force && prev[stateKey]) return prev;
      // contentES conserva HTML para preservar imágenes inline
      const value = stateKey === "contentES"
        ? (tr.translations[deeplKey] || "")
        : (stripHtml(tr.translations[deeplKey]) || "");
      return { ...prev, [stateKey]: value };
    });
  };
  return (
    <div className="translate-page max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">
        🌐 Traducir artículo al español
      </h1>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={fillAllFromDeepl}
          disabled={deeplLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          title="Autotraducir todos los campos (no pisa lo ya escrito)"
        >
          ⚡ Autotraducir con DeepL
        </button>

        {deeplError && (
          <span className="text-red-600 text-sm">DeepL: {deeplError}</span>
        )}
      </div>
      <form className="grid grid-cols-2 gap-6 text-sm">
        {/* Título */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.title)}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Título (alemán)</label>
          </div>
          <p className="field-readonly mt-1">{article.title}</p>
        </div>
        <div>
          <label className="font-bold">Título (español)</label>
          <div className="flex gap-2">
            <input
              name="titleES"
              value={translations.titleES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  titleES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("titleES", "titleES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>
        {/* Subtítulo */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.subtitle || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Subtítulo (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.subtitle) || "—"}
          </p>
        </div>

        <div>
          <label className="font-bold">Subtítulo (español)</label>
          <div className="flex gap-2">
            <input
              name="subtitleES"
              value={translations.subtitleES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  subtitleES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("subtitleES", "subtitleES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.previewText || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Preview Text (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.previewText) || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Preview Text (español)</label>
          <div className="flex gap-2">
            <textarea
              name="previewES"
              value={translations.previewES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded h-24 flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  previewES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("previewES", "previewTextES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>

        {/* Contenido — vista compacta + botón expandir */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold">Contenido</label>
            <button
              type="button"
              onClick={() => setIsContentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              ↗ Expandir para traducir
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Alemán — compacto */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Alemán (original)</p>
              <div
                className="border p-2 rounded h-40 overflow-y-auto prose prose-sm"
                dangerouslySetInnerHTML={{ __html: article.content || "—" }}
              />
            </div>
            {/* Español — compacto */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Español (traducción)</p>
              <div
                ref={contentEditableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  const html = e.currentTarget.innerHTML;
                  setTranslations((prev) => ({ ...prev, contentES: html }));
                }}
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
                className="border p-2 rounded h-40 overflow-y-auto prose prose-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => fillFieldFromDeepl("contentES", "contentES")}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
            >
              ⚡ Autotraducir contenido
            </button>
          </div>
        </div>

        {/* ── Modal pantalla completa ───────────────────────────────────── */}
        {isContentModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-gray-800">Contenido — traducción</h2>
                <button
                  type="button"
                  onClick={() => fillFieldFromDeepl("contentES", "contentES")}
                  disabled={deeplLoading}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded disabled:opacity-50"
                >
                  ⚡ Autotraducir con DeepL
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsContentModalOpen(false)}
                className="text-gray-500 hover:text-black text-sm flex items-center gap-1"
              >
                ✕ Cerrar (Esc)
              </button>
            </div>

            {/* Dos columnas */}
            <div className="flex flex-1 overflow-hidden divide-x">
              {/* Columna izquierda — alemán */}
              <div className="w-1/2 flex flex-col">
                <div className="px-4 py-2 bg-gray-100 border-b shrink-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alemán (original)</span>
                </div>
                <div
                  className="flex-1 overflow-y-auto p-6 prose prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content || "—" }}
                />
              </div>

              {/* Columna derecha — español editable */}
              <div className="w-1/2 flex flex-col">
                <div className="px-4 py-2 bg-purple-50 border-b shrink-0">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Español (traducción editable)</span>
                </div>
                {inlineImages.length > 0 && (
                  <div className="px-4 py-2 border-b bg-green-50 shrink-0">
                    <InlineImageWidget
                      images={inlineImages}
                      imageTranslations={imageTranslations}
                      onInsert={insertInlineImageAtCursor}
                      compact
                    />
                  </div>
                )}
                <div
                  ref={contentEditableModalRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const html = e.currentTarget.innerHTML;
                    setTranslations((prev) => ({ ...prev, contentES: html }));
                  }}
                  onMouseUp={saveSelection}
                  onKeyUp={saveSelection}
                  className="flex-1 overflow-y-auto p-6 prose prose-base max-w-none focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(article.additionalInfo || "")}
              className="text-gray-500 hover:text-black"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <label className="font-bold">Información adicional (alemán)</label>
          </div>
          <p className="field-readonly mt-1">
            {stripHtml(article.additionalInfo) || "—"}
          </p>
        </div>
        <div>
          <label className="font-bold">Información adicional (español)</label>
          <div className="flex gap-2">
            <textarea
              name="additionalInfoES"
              value={translations.additionalInfoES || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded h-24 flex-1"
            />
            <button
              type="button"
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setTranslations((prev) => ({
                  ...prev,
                  additionalInfoES: stripHtml(text),
                }));
              }}
              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300 h-fit mt-1"
              title="Pegar desde portapapeles"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() =>
                fillFieldFromDeepl("additionalInfoES", "additionalInfoES")
              }
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200 h-fit mt-1"
              title="Rellenar con DeepL"
            >
              ⚡
            </button>
          </div>
        </div>
        {/* 🖼️ SECCIÓN DE IMÁGENES */}
        {images.length > 0 && (
          <div className="col-span-2 mt-8 border-t pt-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">
              🖼️ Traducir información de imágenes
            </h2>

            {images.map((img, idx) => (
              <div
                key={img.id}
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex gap-4 mb-3">
                  <img
                    src={img.url}
                    alt={img.alt || "Imagen"}
                    className="w-32 h-32 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Imagen {idx + 1}
                    </p>

                    {/* Title/Caption */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(img.title || "")}
                            className="text-gray-500 hover:text-black"
                            title="Copiar"
                          >
                            <Copy size={14} />
                          </button>
                          <label className="text-xs font-bold">
                            Título/Caption (alemán)
                          </label>
                        </div>
                        <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border">
                          {img.title || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold">
                          Título/Caption (español)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imageTranslations[img.id]?.titleES || ""}
                            onChange={(e) => {
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  titleES: e.target.value,
                                },
                              }));
                            }}
                            className="border p-2 w-full rounded text-sm flex-1"
                            placeholder="Traducir título..."
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText();
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  titleES: stripHtml(text),
                                },
                              }));
                            }}
                            className="px-2 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                            title="Pegar desde portapapeles"
                          >
                            📥
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const tr = await fetchDeepl();
                              if (tr?.imageTranslations?.[img.id]?.titleES) {
                                setImageTranslations((prev) => ({
                                  ...prev,
                                  [img.id]: {
                                    ...prev[img.id],
                                    titleES:
                                      prev[img.id]?.titleES ||
                                      tr.imageTranslations[img.id].titleES,
                                  },
                                }));
                              }
                            }}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
                            title="Rellenar con DeepL"
                          >
                            ⚡
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alt text */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(img.alt || "")}
                            className="text-gray-500 hover:text-black"
                            title="Copiar"
                          >
                            <Copy size={14} />
                          </button>
                          <label className="text-xs font-bold">
                            Alt text (alemán)
                          </label>
                        </div>
                        <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border">
                          {img.alt || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold">
                          Alt text (español)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imageTranslations[img.id]?.altES || ""}
                            onChange={(e) => {
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  altES: e.target.value,
                                },
                              }));
                            }}
                            className="border p-2 w-full rounded text-sm flex-1"
                            placeholder="Traducir alt text..."
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const text = await navigator.clipboard.readText();
                              setImageTranslations((prev) => ({
                                ...prev,
                                [img.id]: {
                                  ...prev[img.id],
                                  altES: stripHtml(text),
                                },
                              }));
                            }}
                            className="px-2 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                            title="Pegar desde portapapeles"
                          >
                            📥
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const tr = await fetchDeepl();
                              if (tr?.imageTranslations?.[img.id]?.altES) {
                                setImageTranslations((prev) => ({
                                  ...prev,
                                  [img.id]: {
                                    ...prev[img.id],
                                    altES:
                                      prev[img.id]?.altES ||
                                      tr.imageTranslations[img.id].altES,
                                  },
                                }));
                              }
                            }}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
                            title="Rellenar con DeepL"
                          >
                            ⚡
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* 🖼️ INLINE IMAGES */}
        {inlineImages.length > 0 && (
          <div className="col-span-2 mt-8 border-t pt-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              🖼️ Inline-Bilder: Credit / Alt übersetzen
            </h2>
            {inlineImages.map((img, idx) => (
              <div
                key={img.id}
                className="mb-4 p-4 bg-green-50 dark:bg-gray-800 rounded-lg border border-green-200"
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={img.url}
                    alt={img.alt || "Inline-Bild"}
                    className="w-24 h-20 object-cover rounded border flex-shrink-0"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {/* Credit / title */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">
                        Credit DE
                      </label>
                      <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border min-h-[2rem]">
                        {img.title || <span className="text-gray-400">—</span>}
                      </p>
                      <label className="text-xs font-bold text-gray-700 block mt-2 mb-1">
                        Credit ES
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={imageTranslations[img.id]?.titleES || ""}
                          onChange={(e) =>
                            setImageTranslations((prev) => ({
                              ...prev,
                              [img.id]: { ...prev[img.id], titleES: e.target.value },
                            }))
                          }
                          placeholder="Credit / Bildnachweis (ES)…"
                          className="border p-2 w-full rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(img.title || "")}
                          className="px-2 text-gray-400 hover:text-black"
                          title="Copiar original"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Alt text */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">
                        Alt-Text DE
                      </label>
                      <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded border min-h-[2rem]">
                        {img.alt || <span className="text-gray-400">—</span>}
                      </p>
                      <label className="text-xs font-bold text-gray-700 block mt-2 mb-1">
                        Alt-Text ES
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={imageTranslations[img.id]?.altES || ""}
                          onChange={(e) =>
                            setImageTranslations((prev) => ({
                              ...prev,
                              [img.id]: { ...prev[img.id], altES: e.target.value },
                            }))
                          }
                          placeholder="Alt-Text (ES)…"
                          className="border p-2 w-full rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(img.alt || "")}
                          className="px-2 text-gray-400 hover:text-black"
                          title="Copiar original"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón guardar */}
        <div className="col-span-2 flex justify-end mt-4">
          {isReviewMode ? (
            <button
              type="button"
              onClick={async () => {
                const confirm = window.confirm(
                  "¿Estás seguro de aprobar esta traducción?",
                );
                if (!confirm) return;

                const res = await fetch(`/api/articles/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...translations,
                    translationStatus: "approved",
                    imageTranslations,
                  }),
                });

                if (res.ok) {
                  await fetch("/api/activity-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      articleId: id,
                      action: "REVIEW_TRANSLATION",
                    }),
                  });

                  alert("✅ Traducción revisada y aprobada");
                  router.replace("/dashboard/articles?mode=reviewer");
                } else {
                  alert("❌ Error al aprobar la traducción");
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              ✅ Aprobar traducción
            </button>
          ) : (
            <div className="flex gap-3">
              {/* Guardar solo metadatos de imágenes */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      imageTranslationsOnly: true,
                      imageTranslations,
                    }),
                  });

                  if (res.ok) {
                    alert("🖼️ Metadatos de imágenes guardados");
                  } else {
                    alert("❌ Error al guardar metadatos");
                  }
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                🖼️ Guardar solo metadatos
              </button>
              {/* Guardar borrador */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...translations,
                      translationStatus: "in_progress",
                      imageTranslations,
                    }),
                  });

                  if (res.ok) {
                    alert("💾 Traducción guardada como borrador");
                  } else {
                    alert("❌ Error al guardar borrador");
                  }
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                💾 Guardar borrador
              </button>

              {/* Enviar traducción */}
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/articles/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...translations,
                      translationStatus: "submitted",
                      imageTranslations,
                    }),
                  });

                  if (res.ok) {
                    alert("📤 Traducción enviada para revisión");
                    router.replace("/dashboard/translators/assignments");
                  } else {
                    alert("❌ Error al enviar traducción");
                  }
                }}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                📤 Enviar traducción
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TranslateArticlePage;
