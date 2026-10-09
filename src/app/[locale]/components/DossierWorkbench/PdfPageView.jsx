"use client";

import { useState, useRef, useEffect } from "react";
import PdfCropBox from "../PdfCropBox/PdfCropBox";

// ── Vista de una página: canvas + text-layer de pdfjs (selección nativa) ───
// El texto se selecciona arrastrando, como cualquier texto. En modo recorte de
// imagen (`cropMode`) el text-layer no captura el ratón y se dibuja un rectángulo
// arrastrando (rubber-band): al soltar se recortan ambas esquinas (coords PDF a
// escala 1, origen abajo-izquierda).
//
// Render LAZY: todas las páginas del PDF están en el DOM, pero el canvas +
// text-layer sólo se renderizan cuando la página está cerca del viewport
// (IntersectionObserver con `rootRef` como root). Al alejarse se libera la
// memoria y queda un placeholder con la altura estimada (`aspect`). Así se puede
// scrollear un dossier entero sin reventar la memoria del navegador.
export default function PdfPageView({ pdfDoc, pageNumber, pdfjs, width, cropMode, onCrop, cropBusy, textRegionMode, onTextRegion, aspect, rootRef }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderRef = useRef(null);
  const taskRef = useRef(null);
  const [dims, setDims] = useState(null); // { scale, pageHeight } a escala 1
  const [visible, setVisible] = useState(false);
  // Rectángulo de arrastre en px relativos al canvas: { x0, y0, x1, y1 }.
  const [drag, setDrag] = useState(null);
  // En modo "Textbereich" el rectángulo queda fijo tras soltar (para poder
  // rehacerlo) y sólo se transcribe al pulsar el botón. { left, top, right, bottom }.
  const [committed, setCommitted] = useState(null);
  // Última región ya insertada en el editor: queda marcada (verde) como referencia
  // de "hasta acá copié" para no perder el hilo. Persiste aunque se salga del modo.
  const [lastInserted, setLastInserted] = useState(null);

  // Modo imagen: el rectángulo queda como recuadro editable (PdfCropBox:
  // mover, redimensionar, GIRAR para imágenes inclinadas) hasta confirmar.
  // Guardado en coords PDF (escala 1, origen arriba-izq) para que el zoom no
  // lo desalinee.
  const [cropBox, setCropBox] = useState(null);

  // Al salir del modo texto se descarta el rectángulo pendiente (no el marcador).
  useEffect(() => {
    if (!textRegionMode) setCommitted(null);
  }, [textRegionMode]);
  useEffect(() => {
    if (!cropMode) setCropBox(null);
  }, [cropMode]);

  // Renderiza cuando la página entra (o se acerca) al viewport; libera al salir.
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
    if (!visible || !pdfDoc || !pdfjs || !canvasRef.current || !textLayerRef.current)
      return;
    let cancelled = false;

    pdfDoc.getPage(pageNumber).then(async (page) => {
      // El canvas solo existe mientras la página está visible: si salió del
      // viewport mientras cargaba, React ya lo desmontó (ref en null) aunque
      // el cleanup de este efecto todavía no haya corrido.
      if (cancelled || !canvasRef.current || !textLayerRef.current) return;
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

      setDims({ scale, pageHeight: base.height });

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

  // Ambos modos (recorte de imagen y "Textbereich") usan el mismo arrastre.
  const dragMode = cropMode || textRegionMode;

  const onDragStart = (e) => {
    if (!dragMode || !dims || !canvasRef.current) return;
    e.preventDefault();
    // Un nuevo arrastre descarta el rectángulo/recuadro pendiente anterior.
    if (textRegionMode) setCommitted(null);
    if (cropMode) setCropBox(null);
    const { x, y } = localPx(e);
    setDrag({ x0: x, y0: y, x1: x, y1: y });
  };

  const onDragMove = (e) => {
    if (!drag) return;
    const { x, y } = localPx(e);
    setDrag((d) => (d ? { ...d, x1: x, y1: y } : d));
  };

  // Spans del text-layer cuyo centro cae dentro del rectángulo (en px locales al
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
    if (!drag || !dims) {
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
    if (textRegionMode) {
      // No transcribe aún: deja el rectángulo fijo para ajustarlo; se transcribe
      // al pulsar el botón "einfügen".
      setCommitted({ left, top, right, bottom });
      return;
    }
    // Modo imagen: no recorta aún — queda el recuadro editable.
    const s = dims.scale;
    setCropBox({
      cx: (left + right) / 2 / s,
      cy: (top + bottom) / 2 / s,
      w: (right - left) / s,
      h: (bottom - top) / s,
      angle: 0,
    });
  };

  const cropScale = dims?.scale || 1;
  const cropBoxPx = cropBox && {
    cx: cropBox.cx * cropScale,
    cy: cropBox.cy * cropScale,
    w: cropBox.w * cropScale,
    h: cropBox.h * cropScale,
    angle: cropBox.angle,
  };

  // Altura del placeholder mientras no está renderizada (ratio de la pág. 1).
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
          style={{ width, cursor: dragMode ? "crosshair" : "auto" }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          // Si el ratón sale del área (típico al seleccionar la última columna,
          // pegada al borde derecho), confirmamos el arrastre en vez de
          // cancelarlo — antes se perdía la selección de la columna del borde.
          onMouseLeave={onDragEnd}
        >
          <canvas ref={canvasRef} className="block bg-white shadow-lg" />
          <div
            ref={textLayerRef}
            className="pdfsel-textLayer absolute top-0 left-0"
            style={{
              lineHeight: 1,
              pointerEvents: dragMode ? "none" : "auto",
            }}
          />
          {dragRect && (
            <div
              className={`absolute border-2 pointer-events-none ${
                textRegionMode
                  ? "border-[#BD0E0D] bg-[#BD0E0D]/20"
                  : "border-blue-600 bg-blue-500/20"
              }`}
              style={{
                left: dragRect.left,
                top: dragRect.top,
                width: dragRect.width,
                height: dragRect.height,
              }}
            />
          )}
          {cropMode && cropBoxPx && !drag && (
            <PdfCropBox
              box={cropBoxPx}
              busy={cropBusy}
              onChange={(b) =>
                setCropBox({
                  cx: b.cx / cropScale,
                  cy: b.cy / cropScale,
                  w: b.w / cropScale,
                  h: b.h / cropScale,
                  angle: b.angle,
                })
              }
              onConfirm={async () => {
                if (cropBusy) return;
                await onCrop?.(pageNumber, cropBox);
                setCropBox(null);
              }}
              onCancel={() => setCropBox(null)}
            />
          )}
          {/* Marcador de progreso: última región insertada en el editor. Queda
              verde como referencia de "hasta acá copié"; pointer-events ninguno. */}
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
                ✓ kopiert
              </span>
            </div>
          )}
          {/* Rectángulo fijo del modo texto: queda hasta pulsar "einfügen"
              (o redibujar). El botón inserta el texto y limpia el rectángulo. */}
          {textRegionMode && committed && !drag && (
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
                    onTextRegion?.(
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
                  📝 Text einfügen
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
          className="mx-auto bg-white shadow-lg flex items-center justify-center text-gray-300 text-xs"
          style={{ width, height: placeholderHeight }}
        >
          Seite {pageNumber}
        </div>
      )}
    </div>
  );
}
