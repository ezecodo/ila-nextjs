"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  paragraphsFromItems,
  reflowBodySelection,
  cleanSelection,
  escapeHtml,
} from "@/lib/pdfSelection";

// Carga pdfjs desde CDN (mismo patrón que PdfReader / from-pdf).
function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("SSR");
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Normaliza para comparar título vs texto del PDF (sin acentos especiales raros,
// sin puntuación, espacios colapsados).
function normalizeForSearch(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9äöüáéíóúñ ]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Busca las páginas cuyo texto contiene el título del artículo. Prueba el título
// completo y, para títulos largos, sus primeras palabras (las columnas o el
// subtítulo pueden partir la línea). El título suele aparecer primero en el
// índice/editorial al comienzo del dossier, así que devolvemos la SEGUNDA
// coincidencia (la página real del artículo) si existe; si solo hay una, esa.
async function findTitlePage(pdfDoc, title) {
  const needle = normalizeForSearch(title);
  if (!needle || needle.length < 4) return null;
  const short = needle.split(" ").slice(0, 6).join(" ");
  const matches = [];
  for (let p = 1; p <= pdfDoc.numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const tc = await page.getTextContent();
    const hay = normalizeForSearch(tc.items.map((i) => i.str).join(" "));
    const hit =
      hay.includes(needle) ||
      (short.length >= 10 && short !== needle && hay.includes(short));
    if (hit) matches.push(p);
    if (matches.length >= 2) break;
  }
  if (matches.length === 0) return null;
  return matches.length >= 2 ? matches[1] : matches[0];
}

// ── Vista de una página: canvas + text-layer de pdfjs ──────────────────────
// La selección es por RECUADRO (rubber-band), igual que el extractor from-pdf:
// se arrastra un rectángulo sobre el texto, queda fijo y al pulsar "insertar" se
// transcribe el texto cuyos spans caen dentro (respetando columnas). El
// text-layer no captura el ratón (pointer-events: none) para que el arrastre
// funcione siempre. Render LAZY con IntersectionObserver.
function PdfPageView({
  pdfDoc,
  pageNumber,
  pdfjs,
  width,
  aspect,
  rootRef,
  onInsertRegion,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderRef = useRef(null);
  const taskRef = useRef(null);
  const [visible, setVisible] = useState(false);
  // Rectángulo de arrastre en px relativos al canvas: { x0, y0, x1, y1 }.
  const [drag, setDrag] = useState(null);
  // Rectángulo fijo tras soltar (se ajusta/transcribe con el botón).
  const [committed, setCommitted] = useState(null);
  // Última región insertada: queda marcada (verde) como "hasta acá copié".
  const [lastInserted, setLastInserted] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: rootRef?.current || null, rootMargin: "1500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootRef]);

  useEffect(() => {
    if (
      !visible ||
      !pdfDoc ||
      !pdfjs ||
      !canvasRef.current ||
      !textLayerRef.current
    )
      return;
    let cancelled = false;

    pdfDoc.getPage(pageNumber).then(async (page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const viewport = page.getViewport({ scale });
      const pixelRatio = window.devicePixelRatio || 1;

      const canvas = canvasRef.current;
      const renderViewport = page.getViewport({ scale: scale * pixelRatio });
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      if (renderRef.current) renderRef.current.cancel?.();
      renderRef.current = page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: renderViewport,
      });

      const textLayer = textLayerRef.current;
      textLayer.innerHTML = "";
      textLayer.style.width = viewport.width + "px";
      textLayer.style.height = viewport.height + "px";
      textLayer.style.setProperty("--scale-factor", String(scale));

      const textContent = await page.getTextContent();
      if (cancelled) return;
      if (taskRef.current) taskRef.current.cancel?.();
      taskRef.current = pdfjs.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
      });
    });

    return () => {
      cancelled = true;
      if (renderRef.current) renderRef.current.cancel?.();
      if (taskRef.current) taskRef.current.cancel?.();
    };
  }, [visible, pdfDoc, pdfjs, pageNumber, width]);

  // Punto px relativo al canvas a partir de un evento de ratón.
  const localPx = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDragStart = (e) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    setCommitted(null);
    const { x, y } = localPx(e);
    setDrag({ x0: x, y0: y, x1: x, y1: y });
  };

  const onDragMove = (e) => {
    if (!drag) return;
    const { x, y } = localPx(e);
    setDrag((d) => (d ? { ...d, x1: x, y1: y } : d));
  };

  // Spans del text-layer cuyo centro cae dentro del rectángulo (px locales al
  // canvas). Devuelve items con la forma que espera paragraphsFromItems.
  const collectTextInRect = (left, top, right, bottom) => {
    const layer = textLayerRef.current;
    const canvas = canvasRef.current;
    if (!layer || !canvas) return [];
    const cRect = canvas.getBoundingClientRect();
    const items = [];
    layer.querySelectorAll("span").forEach((s) => {
      if (!s.firstChild || !s.textContent || !s.textContent.trim()) return;
      const r = s.getBoundingClientRect();
      const x = r.left - cRect.left;
      const y = r.top - cRect.top;
      const cxx = x + r.width / 2;
      const cyy = y + r.height / 2;
      if (cxx >= left && cxx <= right && cyy >= top && cyy <= bottom) {
        items.push({
          str: s.textContent,
          x,
          right: x + r.width,
          y,
          h: r.height,
          font: s.style.fontFamily || "",
        });
      }
    });
    return items;
  };

  const onDragEnd = () => {
    if (!drag) {
      setDrag(null);
      return;
    }
    const left = Math.min(drag.x0, drag.x1);
    const right = Math.max(drag.x0, drag.x1);
    const top = Math.min(drag.y0, drag.y1);
    const bottom = Math.max(drag.y0, drag.y1);
    setDrag(null);
    // Ignora arrastres minúsculos (clicks accidentales).
    if (right - left < 8 || bottom - top < 8) return;
    setCommitted({ left, top, right, bottom });
  };

  const placeholderHeight = width * (aspect || 1.414);

  const dragRect = drag
    ? {
        left: Math.min(drag.x0, drag.x1),
        top: Math.min(drag.y0, drag.y1),
        width: Math.abs(drag.x1 - drag.x0),
        height: Math.abs(drag.y1 - drag.y0),
      }
    : null;

  return (
    <div ref={wrapRef} data-page={pageNumber} style={{ width }}>
      {visible ? (
        <div
          className="relative mx-auto"
          style={{ width, cursor: "crosshair" }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
        >
          <canvas ref={canvasRef} className="block bg-white shadow-lg" />
          <div
            ref={textLayerRef}
            className="pdfsel-textLayer absolute top-0 left-0"
            style={{ lineHeight: 1, pointerEvents: "none" }}
          />
          <span className="absolute top-1 right-2 px-1.5 py-0.5 text-[10px] font-mono bg-black/50 text-white rounded pointer-events-none">
            {pageNumber}
          </span>
          {dragRect && (
            <div
              className="absolute border-2 border-[#BD0E0D] bg-[#BD0E0D]/20 pointer-events-none"
              style={{
                left: dragRect.left,
                top: dragRect.top,
                width: dragRect.width,
                height: dragRect.height,
              }}
            />
          )}
          {lastInserted && (
            <div
              className="absolute border-2 border-dashed border-green-600 bg-green-500/10 pointer-events-none"
              style={{
                left: lastInserted.left,
                top: lastInserted.top,
                width: lastInserted.right - lastInserted.left,
                height: lastInserted.bottom - lastInserted.top,
              }}
            >
              <span className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold bg-green-600 text-white shadow whitespace-nowrap">
                ✓ insertado
              </span>
            </div>
          )}
          {committed && !drag && (
            <>
              <div
                className="absolute border-2 border-dashed border-[#BD0E0D] bg-[#BD0E0D]/10 pointer-events-none"
                style={{
                  left: committed.left,
                  top: committed.top,
                  width: committed.right - committed.left,
                  height: committed.bottom - committed.top,
                }}
              />
              <div
                className="absolute z-20 flex gap-1"
                style={{ left: committed.left, top: committed.bottom + 4 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsertRegion?.(
                      collectTextInRect(
                        committed.left,
                        committed.top,
                        committed.right,
                        committed.bottom
                      )
                    );
                    setLastInserted(committed);
                    setCommitted(null);
                  }}
                  className="px-2.5 py-1 text-xs bg-[#BD0E0D] text-white shadow hover:bg-[#a50c0b] transition-colors"
                >
                  ⬇ Texto insertar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommitted(null);
                  }}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-500 shadow hover:border-gray-500 transition-colors"
                  title="Auswahl verwerfen"
                >
                  ✕
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className="mx-auto bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 text-sm"
          style={{ width, height: placeholderHeight }}
        >
          {pageNumber}
        </div>
      )}
    </div>
  );
}

// Panel del dossier para el modo edición: carga el PDF de la edición, salta a la
// página del título del artículo y permite insertar texto seleccionado con un
// recuadro en el publilab vía `apiRef.current.appendText/appendHeading`.
export default function DossierPdfPanel({ pdfUrl, articleTitle, apiRef }) {
  const [pdfjs, setPdfjs] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState(1.414);
  const [pageWidth, setPageWidth] = useState(540);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [jumpMsg, setJumpMsg] = useState("");
  const [selPreview, setSelPreview] = useState("");
  const scrollRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    loadPdfJs()
      .then(setPdfjs)
      .catch(() => setStatus("error"));
  }, []);

  // Mide el ancho disponible para dimensionar las páginas.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 32;
      if (w > 0) setPageWidth(Math.min(900, Math.max(280, w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollToPage = useCallback((p) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = scrollRef.current?.querySelector(`[data-page="${p}"]`);
        el?.scrollIntoView({ block: "start" });
      });
    });
  }, []);

  // Carga el PDF y salta al título.
  useEffect(() => {
    if (!pdfjs || !pdfUrl) return;
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        setJumpMsg("");
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error("fetch pdf failed");
        const buffer = await res.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        const p1 = await doc.getPage(1);
        const vp = p1.getViewport({ scale: 1 });
        setAspect(vp.height / vp.width);
        setStatus("ready");

        const page = await findTitlePage(doc, articleTitle);
        if (cancelled) return;
        if (page) {
          setJumpMsg(`📍 Salté a la pág. ${page} (título encontrado)`);
          scrollToPage(page);
        } else {
          setJumpMsg("🔎 No encontré el título en el PDF — navegá manual.");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfjs, pdfUrl, articleTitle, scrollToPage]);

  // Inserta los items de la región (recuadro) como bloques del publilab.
  const insertRegion = (items) => {
    const raw = paragraphsFromItems(items);
    const chunk = reflowBodySelection(raw);
    if (!chunk) {
      setSelPreview("⚠️ El recuadro no contiene texto.");
      return;
    }
    if (!apiRef?.current) {
      setSelPreview("⚠️ El editor no está listo.");
      return;
    }
    chunk.split(/\n{2,}/).forEach((part) => {
      const h = part.match(/^#{2,3}\s+(.+)$/);
      if (h) apiRef.current.appendHeading(h[1].trim(), 3);
      else
        apiRef.current.appendText(
          `<p>${escapeHtml(part.replace(/\n/g, " ").trim())}</p>`
        );
    });
    setSelPreview("✓ Insertado: " + cleanSelection(raw).slice(0, 90) + "…");
  };

  return (
    <div ref={wrapRef} className="flex h-full flex-col bg-gray-50">
      <style>{`
        .pdfsel-textLayer { opacity: 1; line-height: 1; text-align: initial; }
        .pdfsel-textLayer span, .pdfsel-textLayer br {
          color: transparent; position: absolute; white-space: pre;
          cursor: text; transform-origin: 0% 0%;
        }
        .pdfsel-textLayer ::selection { background: rgba(189,14,13,0.35); }
      `}</style>
      {/* Barra de estado */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-2 space-y-1.5">
        <p className="text-xs text-gray-500">
          ✏️ Dibujá un recuadro sobre el texto del PDF y pulsá{" "}
          <span className="font-semibold text-[#BD0E0D]">⬇ Texto insertar</span>
        </p>
        {jumpMsg && <p className="text-xs text-gray-600">{jumpMsg}</p>}
        {selPreview && (
          <p className="text-xs text-green-700 truncate">{selPreview}</p>
        )}
      </div>

      {/* Visor */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {status === "loading" && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Cargando dossier…
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 text-center mt-8">
            No se pudo cargar el PDF del dossier.
          </p>
        )}
        {status === "ready" && pdfjs && numPages > 0 && (
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
              <PdfPageView
                key={p}
                pdfDoc={pdfDoc}
                pageNumber={p}
                pdfjs={pdfjs}
                width={pageWidth}
                aspect={aspect}
                rootRef={scrollRef}
                onInsertRegion={insertRegion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
