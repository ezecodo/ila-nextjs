"use client";

import { useState, useRef, useEffect } from "react";
import { cropPdfRegion } from "@/lib/pdfCrop";
import {
  escapeHtml,
  cleanSelection,
  reflowBodySelection,
  paragraphsFromItems,
  getSelectionParagraphs,
} from "@/lib/pdfSelection";
import PdfPageView from "./PdfPageView";

// Rango de zoom del visor de PDF (pageWidth, en px de render). ZOOM_DEFAULT
// es el ancho de partida y la referencia de "100%" que se muestra en los
// controles — no es un tamaño "real" del PDF, sólo el ancho elegido para que
// la primera página entre cómoda.
export const ZOOM_MIN = 400;
export const ZOOM_MAX = 1000;
export const ZOOM_STEP = 40;
export const ZOOM_DEFAULT = 620;

// Mesa de trabajo del Dossier-PDF: visor continuo + herramientas (Markieren /
// Textbereich / Bild / Gedicht), zoom, navegación, selección y la inserción al
// publilab. UNA sola implementación para Artikel aus PDF (from-pdf, que la usa
// en sus dos vistas) y para el Dossier-PDF del editor de artículos
// (DossierPdfWorkbench) — antes el editor tenía una copia recortada y vieja
// (DossierPdfPanel) que se fue quedando sin las herramientas nuevas.
//
// Opciones:
// - pdfDoc/pdfjs/numPages/pageAspect: el documento ya cargado.
// - editorApiRef: API del publilab ({ appendText, appendHeading, appendQuestion,
//   appendPoem }) — adonde va el texto.
// - onCropImage(file, url, pageNumber): recorte de imagen confirmado.
// - onError(msg): error visible para el usuario.
// - routeTextRegion(text): opcional — un "Textbereich" (fuera del Modo Poema)
//   pasa primero por acá; devolver true si el llamador lo mandó a otro campo
//   (Titel, Vorspann…), false para que vaya al cuerpo.
// - onTextWithoutEditor(chunk): opcional — si no hay publilab abierto.
// - floatBarActive: la barra flotante "→ Auswahl anhängen" está montada.
export default function useDossierWorkbench({
  pdfDoc,
  pdfjs,
  numPages,
  pageAspect,
  editorApiRef,
  onCropImage,
  onError,
  routeTextRegion,
  onTextWithoutEditor,
  floatBarActive,
}) {
  const [pageWidth, setPageWidth] = useState(ZOOM_DEFAULT);
  const floatBarRef = useRef(null); // barra flotante anclada al visualViewport

  // Selección actual del PDF.
  const lastSelectionRef = useRef("");
  const bodyParasRef = useRef(""); // párrafos reconstruidos por geometría
  const [selectionPreview, setSelectionPreview] = useState("");

  // Recorte de imágenes del PDF (recuadro → JPEG).
  const [cropMode, setCropMode] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);

  // "Textbereich": arrastrar un rectángulo sobre el cuerpo → extrae el texto
  // dentro, lo reordena por columnas y lo inyecta como bloques en el publilab.
  const [textRegionMode, setTextRegionMode] = useState(false);
  // "Modo Poema": ver comentario largo en linesFromItemsLiteral — desactiva
  // fusión de párrafos/detección de columnas y manda todo a un bloque Poem,
  // preservando cada salto de línea tal cual está en el PDF. Ref en paralelo
  // porque getSelectionParagraphs se llama desde un listener registrado una
  // sola vez (onSelChange, deps []) — leer el state ahí daría un valor stale.
  const [poemMode, setPoemMode] = useState(false);
  const poemModeRef = useRef(false);
  useEffect(() => {
    poemModeRef.current = poemMode;
  }, [poemMode]);

  // Callbacks del llamador en una ref: los usan handlers registrados una vez
  // y funciones que cierran sobre estado del llamador (p. ej. el campo activo).
  const cbRef = useRef({});
  cbRef.current = { onCropImage, onError, routeTextRegion, onTextWithoutEditor, editorApiRef };

  // ¿El texto se extrae literal (cada línea del PDF = una línea)? Sí en Modo
  // Poema y también cuando el destino es una columna de "Spalten": ahí la
  // reconstrucción de párrafos de prosa unía los versos en un bloque corrido
  // y se perdía la disposición del original.
  const literalNow = () =>
    poemModeRef.current ||
    !!cbRef.current.editorApiRef?.current?.isColumnTarget?.();

  // Captura la selección nativa del usuario sobre el text layer.
  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString() : "";
      if (text && text.trim()) {
        const node = sel.anchorNode;
        const el = node?.nodeType === 3 ? node.parentElement : node;
        if (el && el.closest(".pdfsel-textLayer")) {
          lastSelectionRef.current = text;
          bodyParasRef.current = getSelectionParagraphs(literalNow());
          setSelectionPreview(cleanSelection(text).slice(0, 140));
        }
      }
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, []);

  // Mantiene la barra flotante de inserción dentro del área visible aunque se
  // haga pinch-zoom o zoom del navegador. position:fixed se ancla al layout
  // viewport (que con el zoom queda fuera de vista), así que la reposicionamos
  // según el visualViewport (lo que el usuario realmente ve).
  useEffect(() => {
    if (!floatBarActive) return;
    const vv = window.visualViewport;
    const update = () => {
      const el = floatBarRef.current;
      if (!el) return;
      const w = vv ? vv.width : window.innerWidth;
      const h = vv ? vv.height : window.innerHeight;
      const ox = vv ? vv.offsetLeft : 0;
      const oy = vv ? vv.offsetTop : 0;
      el.style.bottom = "auto";
      el.style.left = `${ox + w / 2}px`;
      el.style.top = `${oy + h - 24}px`;
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
    };
  }, [floatBarActive]);

  // Inserta la selección del PDF como bloques en el publilab vía su API. Respeta
  // los párrafos y la detección de entretítulos de reflowBodySelection.
  const appendChunkToEditor = (raw) => {
    const api = editorApiRef?.current;
    // Modo Poema: el texto ya viene literal (getSelectionParagraphs con
    // literal=true) — nada de reflowBodySelection (fusiona líneas en
    // párrafos, pensado para prosa) ni detección de título/Frage. Va directo
    // a un bloque Poem, preservando cada salto de línea tal cual.
    if (poemModeRef.current) {
      if (!raw || !raw.trim()) return;
      if (!api) {
        cbRef.current.onTextWithoutEditor?.(raw.trim());
        return;
      }
      api.appendPoem(raw);
      return;
    }
    // Destino = columna de "Spalten": mismo camino literal (appendPoem lo
    // desvía a la columna enfocada con sus saltos de línea). Se quitan las
    // marcas "## " por si la selección se había reconstruido como prosa antes
    // de enfocar la columna.
    if (api?.isColumnTarget?.()) {
      if (!raw || !raw.trim()) return;
      api.appendPoem(raw.replace(/^#{2,3}\s+/gm, ""));
      return;
    }
    const chunk = reflowBodySelection(raw);
    if (!chunk) return;
    // Sin publilab abierto (vista normal de from-pdf) se acumula en el texto
    // plano del cuerpo.
    if (!api) {
      cbRef.current.onTextWithoutEditor?.(chunk);
      return;
    }
    chunk.split(/\n{2,}/).forEach((part) => {
      const h = part.match(/^#{2,3}\s+(.+)$/);
      const flat = part.replace(/\n/g, " ").trim();
      if (h) {
        api.appendHeading(h[1].trim(), 3);
      } else if (/\?["')\]]?\s*$/.test(flat) && flat.length <= 300) {
        // Entrevista: un párrafo entero que termina en "?" es una Frage —
        // suelen ser 1-2 oraciones bastante más largas que un Zwischentitel,
        // por eso se detecta acá (a nivel párrafo) y no en isHeading (línea).
        api.appendQuestion(flat);
      } else {
        api.appendText(`<p>${escapeHtml(flat)}</p>`);
      }
    });
  };
  const appendBodyToEditor = () =>
    appendChunkToEditor(bodyParasRef.current || lastSelectionRef.current);
  const appendHeadingToEditor = () => {
    const clean = cleanSelection(lastSelectionRef.current);
    if (clean && editorApiRef?.current) editorApiRef.current.appendHeading(clean, 3);
  };

  // "Textbereich": recibe los spans dentro del rectángulo, los reordena por
  // columnas (orden de lectura) y los anexa — al cuerpo, salvo que el
  // llamador lo mande a otro campo (routeTextRegion).
  const takeTextRegion = (items) => {
    const literal = literalNow();
    const text = paragraphsFromItems(items, literal);
    if (!text) return;
    setSelectionPreview(cleanSelection(text).slice(0, 140));
    // Modo Poema: siempre al cuerpo (bloque Poem), sin importar qué campo
    // estaba enfocado — un poema no tiene sentido como Titel/Vorspann/etc.
    // Lo mismo si el destino es una columna de "Spalten".
    if (literal) {
      appendChunkToEditor(text);
      return;
    }
    if (cbRef.current.routeTextRegion?.(text)) return;
    appendChunkToEditor(text);
  };

  // Recorta el recuadro (posiblemente girado) de una página y se lo pasa al
  // llamador como archivo JPEG.
  const cropAndAdd = async (pageNumber, box) => {
    if (!pdfDoc) return;
    setCropBusy(true);
    try {
      const blob = await cropPdfRegion(pdfDoc, pageNumber, box);
      if (!blob) throw new Error("crop failed");
      const file = new File([blob], `pdf-bild-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(blob);
      cbRef.current.onCropImage?.(file, url, pageNumber);
    } catch (err) {
      console.error(err);
      cbRef.current.onError?.("Das Bild konnte nicht ausgeschnitten werden.");
    } finally {
      setCropBusy(false);
    }
  };

  // Línea de ayuda sobre el visor: explica el modo activo. Los botones de
  // modo viven en la barra vertical (toolRail) pegada al costado del PDF.
  const markBar = (
    <div className="px-1 py-1.5 mb-2 text-xs text-gray-400">
      {textRegionMode
        ? "Rechteck über den Artikeltext ziehen → bleibt stehen; mit „Text einfügen“ übernehmen (oder neu ziehen)."
        : cropMode
          ? "Rechteck über das Bild ziehen → anpassen/drehen → „✂ Ausschneiden“ (oder Enter)."
          : "Text markieren & rechts zuweisen — oder „Textbereich“ für ganze Spalten."}
    </div>
  );

  // Barra vertical de herramientas al costado del PDF, sticky: queda a mano
  // mientras se scrollea el dossier (antes era una fila arriba del visor y
  // había que volver a subir para cambiar de Textbereich a Bild y viceversa).
  // Markieren / Textbereich / Bild son excluyentes; Gedicht se combina.
  const railBtn = (active, activeCls, idleCls) =>
    `w-12 flex flex-col items-center justify-center gap-0.5 py-1.5 border text-[10px] leading-tight transition-colors disabled:opacity-40 ${
      active ? activeCls : idleCls
    }`;
  const toolRail = (
    <div className="flex flex-col gap-1.5 bg-white border border-gray-200 shadow-sm p-1">
      <button
        type="button"
        onClick={() => {
          setTextRegionMode(false);
          setCropMode(false);
        }}
        className={railBtn(
          !textRegionMode && !cropMode,
          "bg-gray-800 text-white border-gray-800",
          "border-gray-300 text-gray-600 hover:bg-gray-100"
        )}
        title="Text frei markieren (normale Auswahl) und rechts einem Feld zuweisen"
      >
        <span className="text-base leading-none">𝐈</span>
        Markieren
      </button>
      <button
        type="button"
        onClick={() => {
          setTextRegionMode((m) => !m);
          setCropMode(false);
        }}
        className={railBtn(
          textRegionMode,
          "bg-[#BD0E0D] text-white border-[#BD0E0D]",
          "border-[#BD0E0D] text-[#BD0E0D] hover:bg-[#BD0E0D]/10"
        )}
        title="Textbereich: ein Rechteck über den Artikeltext ziehen — der Text wird spaltenweise eingefügt"
      >
        <span className="text-base leading-none">📝</span>
        Text
      </button>
      <button
        type="button"
        onClick={() => {
          setCropMode((m) => !m);
          setTextRegionMode(false);
        }}
        disabled={cropBusy}
        className={railBtn(
          cropMode,
          "bg-blue-600 text-white border-blue-600",
          "border-blue-600 text-blue-700 hover:bg-blue-50"
        )}
        title="Bild ausschneiden: Rechteck über das Bild ziehen, anpassen/drehen, bestätigen"
      >
        <span className="text-base leading-none">{cropBusy ? "…" : "🖼"}</span>
        Bild
      </button>
      <span className="h-px bg-gray-200 my-0.5" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setPoemMode((m) => !m)}
        className={railBtn(
          poemMode,
          "bg-purple-600 text-white border-purple-600",
          "border-purple-600 text-purple-600 hover:bg-purple-600/10"
        )}
        title="Gedicht-Modus: keine Absatz-/Spaltenrekonstruktion, jede Zeile wird 1:1 aus dem PDF übernommen (Zeilenumbrüche = Verse)"
      >
        <span className="text-base leading-none">📜</span>
        Gedicht
      </button>
    </div>
  );

  // Scrollea hasta una página dentro del contenedor indicado.
  const scrollToPage = (rootRef, n, behavior = "smooth") => {
    const root = rootRef?.current;
    if (!root) return;
    const el = root.querySelector(`[data-page="${n}"]`);
    if (el) el.scrollIntoView({ behavior, block: "start" });
  };

  // Salta a una página apenas exista en el DOM — el contenedor (p. ej. el
  // leftPanel del publilab) puede tardar más de un par de frames en montarse,
  // así que se reintenta por rAF en vez de asumir un delay fijo.
  const jumpToPageWhenReady = (rootRef, n) => {
    const target = Number(n) || 1;
    let attempts = 0;
    const tryScroll = () => {
      attempts++;
      const el = rootRef?.current?.querySelector(`[data-page="${target}"]`);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      else if (attempts < 30) requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  };

  // Cambia pageWidth preservando la página que se está leyendo. Sin esto: al
  // hacer zoom cambia el alto de TODAS las páginas apiladas (misma pageWidth
  // para todas), y el contenedor mantiene el mismo scrollTop en píxeles —
  // que tras el resize cae en un punto distinto del documento, "saltando" a
  // otra página. Ancla la página visible arriba del viewport y la fracción
  // ya scrolleada dentro de ella ANTES del cambio, y la restaura una vez que
  // el nuevo ancho ya se pintó. El resize del canvas ocurre dentro de un
  // .then() (async) en PdfPageView, así que un solo rAF puede llegar antes
  // de que termine — de ahí los dos anidados, no es descuido.
  const setPageWidthPreserveScroll = (rootRef, newWidth) => {
    const root = rootRef?.current;
    if (!root) {
      setPageWidth(newWidth);
      return;
    }
    const rootRect = root.getBoundingClientRect();
    const pageEls = Array.from(root.querySelectorAll("[data-page]"));
    let anchor = null;
    for (const el of pageEls) {
      const r = el.getBoundingClientRect();
      const relTop = r.top - rootRect.top;
      if (relTop + r.height > 0) {
        anchor = {
          num: el.dataset.page,
          fraction: relTop < 0 ? -relTop / r.height : 0,
        };
        break;
      }
    }
    setPageWidth(newWidth);
    if (!anchor) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = root.querySelector(`[data-page="${anchor.num}"]`);
        if (!el) return;
        const newRootRect = root.getBoundingClientRect();
        const newElRect = el.getBoundingClientRect();
        const currentRelTop = newElRect.top - newRootRect.top;
        const desiredRelTop = -(anchor.fraction * newElRect.height);
        root.scrollTop += currentRelTop - desiredRelTop;
      });
    });
  };

  // "Übersicht": calcula el ancho de render (pageWidth maneja el alto vía
  // pageAspect) para que la página completa entre en el alto visible del
  // contenedor, sin scrollear para verla entera. OJO: esto es solo para
  // orientarse rápido en una página nueva — si el panel no es muy alto (caso
  // típico del modo split), el ancho resultante achica la página en vez de
  // agrandarla (no hay forma de mostrar el alto completo Y agrandar al mismo
  // tiempo si el panel no tiene esa altura; es una restricción física, no un
  // bug). Para seleccionar texto con precisión, usar los botones de Zoom
  // (adjustZoom) en su lugar — feedback real de un usuario tras probar esto
  // pensando que serviría para lo mismo. Clampeado al mismo rango que el
  // stepper de zoom y reusa su mismo anclaje de scroll (no salta de página).
  const fitPageToHeight = (rootRef) => {
    const el = rootRef?.current;
    if (!el) return;
    const availableHeight = el.clientHeight - 24; // p-3 = 12px arriba y abajo
    if (availableHeight <= 0) return;
    const width = Math.round(availableHeight / pageAspect);
    setPageWidthPreserveScroll(
      rootRef,
      Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, width))
    );
  };

  // Botones −/+: un paso de zoom discreto (más fácil de acertar con el mouse
  // o trackpad que arrastrar el slider nativo, sobre todo para ajustes chicos).
  const adjustZoom = (rootRef, delta) => {
    const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pageWidth + delta));
    setPageWidthPreserveScroll(rootRef, next);
  };

  // Barra de navegación del visor continuo: ir a página + zoom. `navExtra` =
  // botones propios del llamador al final (p. ej. "Dossier wechseln").
  const renderPageNav = (rootRef, navExtra = null) => (
    <div className="flex items-center gap-2 mb-2 flex-wrap text-sm">
      <span className="text-gray-500 text-xs">Gehe zu Seite</span>
      <input
        type="number"
        min={1}
        max={numPages}
        defaultValue={1}
        onChange={(e) => {
          const n = Math.max(1, Math.min(numPages, Number(e.target.value) || 1));
          scrollToPage(rootRef, n);
        }}
        className="w-16 border border-gray-300 px-2 py-1 text-center"
      />
      <span className="text-gray-500">/ {numPages}</span>
      {/* Stepper de zoom: botones grandes en vez del slider nativo (difícil de
          acertar con precisión, sobre todo con trackpad, para ajustes chicos).
          El porcentaje central es clickeable y resetea a 100% (= ZOOM_DEFAULT,
          el ancho de partida). Grupo con bordes compartidos, mismo lenguaje
          visual que los demás botones de esta barra. */}
      <div className="flex items-center ml-2 border border-gray-300 divide-x divide-gray-300">
        <button
          type="button"
          onClick={() => adjustZoom(rootRef, -ZOOM_STEP)}
          disabled={pageWidth <= ZOOM_MIN}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-base leading-none"
          title="Verkleinern"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setPageWidthPreserveScroll(rootRef, ZOOM_DEFAULT)}
          className="min-w-[3.25rem] h-7 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 tabular-nums transition-colors"
          title="Auf 100% zurücksetzen"
        >
          {Math.round((pageWidth / ZOOM_DEFAULT) * 100)}%
        </button>
        <button
          type="button"
          onClick={() => adjustZoom(rootRef, ZOOM_STEP)}
          disabled={pageWidth >= ZOOM_MAX}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-base leading-none"
          title="Vergrößern"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => fitPageToHeight(rootRef)}
        className="text-xs px-2 py-1 border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        title="Schnelle Übersicht der Seite (zum Orientieren) — zum genauen Markieren die Zoom-Buttons benutzen"
      >
        📄 Übersicht
      </button>
      {navExtra}
    </div>
  );

  // Pila vertical con TODAS las páginas (scroll continuo). Render lazy: cada
  // PdfPageView se dibuja sólo cerca del viewport. La selección nativa con Shift
  // cruza las páginas que estén renderizadas en ese momento.
  const renderPageStack = (rootRef) =>
    pdfjs && numPages ? (
      <div className="flex flex-col items-center gap-5">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
          <PdfPageView
            key={p}
            pdfDoc={pdfDoc}
            pageNumber={p}
            pdfjs={pdfjs}
            width={pageWidth}
            cropMode={cropMode}
            onCrop={cropAndAdd}
            cropBusy={cropBusy}
            textRegionMode={textRegionMode}
            onTextRegion={takeTextRegion}
            aspect={pageAspect}
            rootRef={rootRef}
          />
        ))}
      </div>
    ) : null;

  return {
    pageWidth,
    poemMode,
    setPoemMode,
    setCropMode,
    selectionPreview,
    lastSelectionRef,
    floatBarRef,
    appendBodyToEditor,
    appendHeadingToEditor,
    appendChunkToEditor,
    scrollToPage,
    jumpToPageWhenReady,
    markBar,
    toolRail,
    renderPageNav,
    renderPageStack,
  };
}
