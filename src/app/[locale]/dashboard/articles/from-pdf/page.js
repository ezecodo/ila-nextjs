"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import CheckboxField from "../../../components/Articles/NewArticle/CheckboxField";
import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";
import { loadPdfJs } from "@/lib/pdfCrop";
import {
  escapeHtml,
  cleanSelection,
  cleanAuthorName,
} from "@/lib/pdfSelection";
import useDossierWorkbench from "../../../components/DossierWorkbench/useDossierWorkbench";
import DossierWorkbenchPanel from "../../../components/DossierWorkbench/DossierWorkbenchPanel";

// El publilab (InterviewEditor) usa el DOM; igual que en ArticleFormV2 se carga
// sin SSR.
const InterviewEditor = dynamic(
  () => import("../../../components/InterviewEditor/InterviewEditor"),
  { ssr: false }
);
// react-select async (igual que ArticleFormV2) para Regionen/Themen con
// búsqueda + crear-al-vuelo.
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
// Editor rich para Zusatzinfo (con botón de link), igual que en ArticleFormV2.
const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);
// Toolbar reducida para el Vorspann: el default (headers, listas, poema...)
// no entra bien en el panel angosto del modo split (PDF a la izquierda) y el
// toolbar se corta — acá alcanza con negrita/cursiva/link/dossier.
const VORSPANN_TOOLBAR = [["bold", "italic"], ["link"], ["dossier"]];




// Aplana un árbol de regiones/temas a opciones { value, label } con etiqueta
// jerárquica ("Padre > Hijo"), igual que ArticleFormV2.
function flattenTreeOptions(nodes, parentName = "") {
  const options = [];
  for (const node of nodes || []) {
    const label = parentName ? `${parentName} > ${node.name}` : node.name;
    options.push({ value: node.id, label });
    if (node.children?.length)
      options.push(...flattenTreeOptions(node.children, label));
  }
  return options;
}

// Ordena opciones por relevancia frente a la búsqueda: exactas → empiezan → contienen.
function rankOptions(flat, query) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const nq = norm(query);
  if (!nq) return flat;
  const exact = flat.filter((o) => norm(o.label) === nq);
  const starts = flat.filter(
    (o) => norm(o.label).startsWith(nq) && norm(o.label) !== nq
  );
  const includes = flat.filter(
    (o) => norm(o.label).includes(nq) && !norm(o.label).startsWith(nq)
  );
  return [...exact, ...starts, ...includes];
}


// Vaciar un QuillEditor a mano (seleccionar todo + borrar) no deja su value en
// "" — Quill se queda con su bloque vacío ("<p><br></p>" o "<p></p>"). Si eso
// se concatena tal cual antes del próximo texto pegado desde el PDF, queda
// como una línea en blanco delante de lo recién insertado. Se recorta
// cualquier <p> vacío colgando al final de lo ya existente antes de sumarle
// el nuevo bloque.
function stripTrailingEmptyParagraph(html) {
  return (html || "").replace(/(?:<p>(?:<br\s*\/?>)?<\/p>\s*)+$/i, "");
}

// Convierte el cuerpo al HTML del artículo. Línea en blanco = nuevo párrafo
// (<p>), salto de línea simple = <br>, líneas "## " = entretítulo (<h3>/<h4>).
// Se procesa LÍNEA por LÍNEA: una línea con "## " titula SÓLO esa línea; el
// texto que la sigue (aunque vaya pegado, con salto simple) queda como párrafo
// aparte y no hereda el formato de título.
function bodyTextToHtml(text) {
  if (!text || !text.trim()) return "";
  const out = [];
  let para = [];
  const flushPara = () => {
    const inner = para
      .map((l) => escapeHtml(l.trim()))
      .filter(Boolean)
      .join("<br>");
    if (inner) out.push(`<p>${inner}</p>`);
    para = [];
  };
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.replace(/[ \t]+$/g, "");
    const heading = line.match(/^#{2,3}\s+(.+)$/);
    if (heading) {
      flushPara();
      const inner = escapeHtml(heading[1].replace(/\s+/g, " ").trim());
      // El Publilab (InterviewEditor) genera los Zwischentitel siempre como
      // <h3>; replicamos ese formato canónico para que se vean igual.
      out.push(`<h3>${inner}</h3>`);
    } else if (line.trim() === "") {
      flushPara();
    } else {
      para.push(line);
    }
  }
  flushPara();
  return out.join("\n");
}

// Campo de texto con botón "tomar selección del PDF".
function PdfField({ label, value, onChange, onTake, getSelection, multiline, required, onFocusField }) {
  // Recuerda la posición del cursor en el campo para poder insertar la selección
  // del PDF justo ahí (útil con Vorspann/texto partido en columnas).
  const caretRef = useRef(null);
  const rememberCaret = (e) => {
    caretRef.current = e.target.selectionStart;
  };

  // Inserta la selección del PDF en la posición del cursor (o al final),
  // uniéndola con un espacio en vez de reemplazar lo que ya hay.
  const appendSelection = () => {
    const sel = (getSelection?.() || "").trim();
    if (!sel) return;
    const cur = value || "";
    let pos = caretRef.current;
    if (pos == null || pos > cur.length) pos = cur.length;
    const left = cur.slice(0, pos).replace(/\s+$/, "");
    const right = cur.slice(pos).replace(/^\s+/, "");
    const next = [left, sel, right].filter(Boolean).join(" ");
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">
          {label} {required && <span className="text-[#BD0E0D]">*</span>}
        </label>
        <div className="flex items-center gap-1">
          {getSelection && (
            <button
              type="button"
              onClick={appendSelection}
              className="text-xs px-2 py-0.5 border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
              title="PDF-Auswahl an der Cursorposition einfügen (anhängen, nicht ersetzen)"
            >
              ＋ einfügen
            </button>
          )}
          <button
            type="button"
            onClick={onTake}
            className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            title="Aktuelle PDF-Auswahl übernehmen (ersetzt das Feld)"
          >
            ← Auswahl
          </button>
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={rememberCaret}
          onKeyUp={rememberCaret}
          onClick={rememberCaret}
          onFocus={onFocusField}
          className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={rememberCaret}
          onKeyUp={rememberCaret}
          onClick={rememberCaret}
          onFocus={onFocusField}
          className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
        />
      )}
    </div>
  );
}

export default function FromPdfPage() {
  const { data: session } = useSession();
  const [pdfjs, setPdfjs] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [fileName, setFileName] = useState("");
  // Visor continuo: TODAS las páginas viven en el DOM, render lazy según el
  // viewport. `pageAspect` (alto/ancho de la pág. 1) reserva la altura de los
  // placeholders. Refs a los contenedores con scroll para el IntersectionObserver.
  const [pageAspect, setPageAspect] = useState(1.414);
  const scrollRef = useRef(null);
  const fsScrollRef = useRef(null);
  const editorApi = useRef(null); // API del publilab en modo split: { appendText, appendHeading }
  const [loading, setLoading] = useState(false);

  // Selector de dossiers ya subidos al módulo Digital-ABO (EditionPdf).
  // Permite traer el PDF desde el servidor en vez de hacer upload manual.
  const [dossiers, setDossiers] = useState([]);
  const [dossierPickerOpen, setDossierPickerOpen] = useState(false);
  const [loadingDossiers, setLoadingDossiers] = useState(false);


  // Último campo de texto enfocado ("body" | "vorspann") — decide a dónde va
  // el "Textbereich" al insertar. Nunca se resetea solo al perder foco (igual
  // que lastFocusedBlockRef en InterviewEditor): arrastrar la selección en el
  // PDF no debe "olvidar" que se estaba escribiendo el Vorspann.
  const activeFieldRef = useRef("body");

  // Campos del artículo.
  // Fecha de publicación editable (antes fija a "ahora" sin forma de
  // cambiarla). Si queda en el futuro, el artículo se crea programado
  // (isPublished se deriva de esto al enviar), igual que en new/page.js.
  const [publicationDate, setPublicationDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [content, setContent] = useState("");

  // Publilab (InterviewEditor) como editor del Fließtext. El cuerpo se compone en
  // el Vollbild (PDF + publilab); al guardar, `contentHtml` es la fuente de verdad
  // (publilabOn=true). Antes de tocarlo, `content` guarda el texto plano que
  // pudo rellenar Claude ("## " = entretítulo).
  const [publilabOn, setPublilabOn] = useState(false);
  const [contentHtml, setContentHtml] = useState("");

  // Relaciones / catálogos.
  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState("");

  // Artículos que YA existen en el dossier elegido — para que quien
  // transcribe pueda chequear si un artículo del índice ya se cargó antes de
  // volver a tipearlo. Se recarga cada vez que cambia editionId.
  const [existingArticles, setExistingArticles] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingOpen, setExistingOpen] = useState(false);
  const [beitragstypen, setBeitragstypen] = useState([]);
  const [beitragstypId, setBeitragstypId] = useState("");
  const [beitragssubtypId, setBeitragssubtypId] = useState("");
  const [categories, setCategories] = useState([]);
  // Mismo patrón que ArticleFormV2: Kategorien como array de IDs (checkboxes),
  // Regionen/Themen como [{ value, label }] (react-select async).
  const [selCategories, setSelCategories] = useState([]);
  const [selRegions, setSelRegions] = useState([]);
  const [selTopics, setSelTopics] = useState([]);

  // Autores.
  const [authorsCache, setAuthorsCache] = useState([]);
  const [selAuthors, setSelAuthors] = useState([]);
  const [authorBusy, setAuthorBusy] = useState(false);

  // Entrevistado/a (solo aplica si el Beitragstyp elegido es "Interview",
  // igual que en ArticleFormV2).
  const [selInterviewees, setSelInterviewees] = useState([]);
  const [intervieweeBusy, setIntervieweeBusy] = useState(false);

  // Rango de páginas del cuerpo (referencia de la edición impresa: startPage/endPage).
  const [bodyFrom, setBodyFrom] = useState("");
  const [bodyTo, setBodyTo] = useState("");

  // Recorte de imágenes del PDF (dos esquinas → JPEG → galería).
  const [images, setImages] = useState([]); // { id, file, url, page, title, alt }
  // Módulo estándar de imágenes (ImageGalleryManager, el mismo del editor
  // normal) para fotos que ya existen como archivo — no hace falta recortarlas
  // del scan. Van ANTES que los recortes al crear el artículo, así la primera
  // subida acá es la imagen principal.
  const [gallery, setGallery] = useState([]);
  // URLs de imágenes del módulo estándar que se insertaron DENTRO del texto
  // desde el Publilab (salen de `gallery`); van en inlineImageUrls al crear.
  const [inlineGalleryUrls, setInlineGalleryUrls] = useState([]);
  const galleryPreviews = useMemo(
    () =>
      gallery
        .filter((img) => img.file && img._localId)
        .map((img) => ({
          id: img._localId,
          url: URL.createObjectURL(img.file),
          title: img.title || "",
          alt: img.alt || "",
        })),
    [gallery]
  );
  useEffect(
    () => () => galleryPreviews.forEach((img) => URL.revokeObjectURL(img.url)),
    [galleryPreviews]
  );

  // Editor de cuerpo a pantalla completa (PDF | artículo).
  const [bodyFullscreen, setBodyFullscreen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Bannerchen central tras darle a "Artikel anlegen": avanza solo por las
  // fases "hinzugefügt → hinzugefügt! → zurück zum Dossier" y se desvanece —
  // no tapa el panel PDF/Formular, para poder seguir transcribiendo el
  // siguiente artículo del mismo dossier sin volver a elegirlo.
  const [bannerPhase, setBannerPhase] = useState(null); // null | "uploading" | "success" | "returning"
  const [bannerFading, setBannerFading] = useState(false);
  const bannerTimersRef = useRef([]);
  const clearBannerTimers = () => {
    bannerTimersRef.current.forEach(clearTimeout);
    bannerTimersRef.current = [];
  };
  useEffect(() => clearBannerTimers, []);

  // Carga pdfjs y catálogos al montar.
  useEffect(() => {
    loadPdfJs().then(setPdfjs).catch(() => setError("pdfjs konnte nicht geladen werden."));
    fetch("/api/beitragstypen").then((r) => r.json()).then(setBeitragstypen).catch(() => {});
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
    fetch("/api/authors").then((r) => r.json()).then((d) => setAuthorsCache(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/editions?admin=true&limit=500&page=1")
      .then((r) => r.json())
      .then((d) => setEditions(d.items || (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, []);

  // Recarga los artículos ya cargados del dossier elegido (todos, publicados
  // o no — es un tool de admin). El endpoint recibe el NÚMERO de edición, no
  // el id de la BD. Reutilizable: la dispara el cambio de editionId y,
  // manualmente, la creación de un artículo nuevo (para que la lista no
  // quede vieja mientras se sigue transcribiendo el mismo dossier).
  const refreshExistingArticles = useCallback(
    async (edId) => {
      const edition = editions.find((ed) => String(ed.id) === String(edId));
      if (!edition) return;
      setLoadingExisting(true);
      try {
        const res = await fetch(`/api/articles/edition/${edition.number}`);
        const d = res.ok ? await res.json() : [];
        setExistingArticles(Array.isArray(d) ? d : []);
      } catch {
        setExistingArticles([]);
      } finally {
        setLoadingExisting(false);
      }
    },
    [editions]
  );

  useEffect(() => {
    if (!editionId) {
      setExistingArticles([]);
      return;
    }
    refreshExistingArticles(editionId);
  }, [editionId, refreshExistingArticles]);

  // Esc cierra el modo pantalla completa del cuerpo.
  useEffect(() => {
    if (!bodyFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBodyFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bodyFullscreen]);

  // Carga un PDF (ya leído como ArrayBuffer) en el visor y reinicia el estado del
  // dossier. Reutilizado por el upload manual y por el selector de Digital-ABO.
  const loadPdfBuffer = async (buffer, name) => {
    if (!pdfjs) return;
    setError(null);
    setLoading(true);
    setFileName(name);
    // Nuevo dossier → cierra el publilab y limpia su HTML.
    setPublilabOn(false);
    setContentHtml("");
    try {
      const doc = await pdfjs.getDocument({ data: buffer }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      try {
        const page1 = await doc.getPage(1);
        const vp = page1.getViewport({ scale: 1 });
        setPageAspect(vp.height / vp.width);
      } catch {
        setPageAspect(1.414);
      }
    } catch (err) {
      console.error("PDF load error:", err);
      setError("Das PDF konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  // Lista los dossiers que ya tienen PDF subido en el módulo Digital-ABO.
  const loadDossiers = async () => {
    setLoadingDossiers(true);
    try {
      const res = await fetch(
        "/api/editions?admin=true&limit=500&sortField=number&sortOrder=desc"
      );
      const data = await res.json();
      const items = (data?.items || [])
        .filter((e) => e.pdf?.pdfUrl)
        .map((e) => ({
          id: e.id,
          number: e.number,
          title: e.title,
          pdfUrl: e.pdf.pdfUrl,
        }));
      setDossiers(items);
    } catch (err) {
      console.error("Dossier-Liste error:", err);
      setError("Die Dossier-Liste konnte nicht geladen werden.");
    } finally {
      setLoadingDossiers(false);
    }
  };

  const openDossierPicker = () => {
    setDossierPickerOpen(true);
    if (dossiers.length === 0) loadDossiers();
  };

  // Trae el PDF del dossier elegido desde el servidor y lo carga en el visor.
  const pickDossier = async (d) => {
    setDossierPickerOpen(false);
    setLoading(true);
    // El dossier elegido para transcribir es, casi siempre, el mismo que va
    // en "Dossier (Ausgabe)" — se fija solo para no tener que elegirlo de
    // nuevo, y de paso dispara la carga de artículos ya existentes.
    setEditionId(String(d.id));
    try {
      const res = await fetch(d.pdfUrl);
      if (!res.ok) throw new Error("fetch pdf failed");
      const buffer = await res.arrayBuffer();
      await loadPdfBuffer(buffer, `ila ${d.number} — ${d.title}`);
    } catch (err) {
      console.error("Dossier-PDF load error:", err);
      setError("Das Dossier-PDF konnte nicht geladen werden.");
      setLoading(false);
    }
  };

  const takeInto = (setter) => () => {
    const clean = cleanSelection(lastSelectionRef.current);
    if (clean) setter(clean);
  };

  // ── Mesa de trabajo del PDF (visor + herramientas + inserción al publilab) ──
  // Compartida con el Dossier-PDF del editor de artículos — ver
  // components/DossierWorkbench/useDossierWorkbench.
  // "Textbereich" fuera del Modo Poema: va al campo activo — el cuerpo por
  // defecto, o Titel/Untertitel/Vorspann/Zusatzinfo/Autor:in/pie de imagen si
  // fue el último campo enfocado. Devuelve true si lo mandó a un campo (el
  // hook no lo inserta en el cuerpo).
  const routeTextRegionToField = (text) => {
    const field = activeFieldRef.current;
    if (field === "title" || field === "subtitle") {
      // Titel/Untertitel son de una sola línea: aplanar todo a texto plano,
      // sin marcas de entretítulo ni saltos de párrafo.
      const flat = text
        .split(/\n+/)
        .map((p) => cleanSelection(p).replace(/^#{2,3}\s+/, ""))
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!flat) return true;
      const setter = field === "title" ? setTitle : setSubtitle;
      setter((prev) => (prev ? prev + " " + flat : flat));
      return true;
    }
    // Bildunterschrift / Alt-Text de una imagen (recortada del PDF o subida
    // con el módulo estándar): una sola línea, se AGREGA al texto existente.
    const imgTarget = /^(cropImg|galleryImg):([^:]+):(title|alt)$/.exec(field || "");
    if (imgTarget) {
      const flat = text
        .split(/\n+/)
        .map((p) => cleanSelection(p).replace(/^#{2,3}\s+/, ""))
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!flat) return true;
      const [, kind, key, prop] = imgTarget;
      const append = (prev) => (prev ? prev + " " + flat : flat);
      if (kind === "cropImg") {
        setImages((prev) =>
          prev.map((x) => (String(x.id) === key ? { ...x, [prop]: append(x[prop]) } : x))
        );
      } else {
        setGallery((prev) =>
          prev.map((x, i) => (String(i) === key ? { ...x, [prop]: append(x[prop]) } : x))
        );
      }
      return true;
    }
    if (field === "author" || field === "interviewee") {
      // Autor/Entrevistado son de una sola línea, y cleanAuthorName
      // (versalitas, prefijo "von"/"Text:"/"Interview:", etc.) ya hace su
      // propia limpieza — solo hace falta aplanar y sacar un posible "## "
      // si la línea se marcó como título.
      const flat = text
        .split(/\n+/)
        .map((p) => p.replace(/^#{2,3}\s+/, ""))
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!flat) return true;
      if (field === "author") addAuthorByName(cleanAuthorName(flat));
      else addIntervieweeByName(cleanAuthorName(flat));
      return true;
    }
    if (field === "vorspann" || field === "additionalInfo") {
      const html = text
        .split(/\n{2,}/)
        .map((p) => cleanSelection(p).replace(/^#{2,3}\s+/, ""))
        .filter(Boolean)
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("");
      if (!html) return true;
      const setter = field === "vorspann" ? setPreviewText : setAdditionalInfo;
      setter((prev) => stripTrailingEmptyParagraph(prev) + html);
      return true;
    }
    return false;
  };

  const wb = useDossierWorkbench({
    pdfDoc,
    pdfjs,
    numPages,
    pageAspect,
    editorApiRef: editorApi,
    // role: "haupt" = imagen principal (galería) | "text" = insertada inline.
    onCropImage: (file, url, page) =>
      setImages((prev) => [
        ...prev,
        { id: Date.now(), file, url, page, title: "", alt: "", role: "haupt" },
      ]),
    onError: setError,
    routeTextRegion: routeTextRegionToField,
    // Sin publilab abierto, el texto se acumula en el cuerpo plano.
    onTextWithoutEditor: (chunk) =>
      setContent((prev) => (prev ? prev + "\n\n" : "") + chunk),
    floatBarActive: bodyFullscreen,
  });
  const {
    lastSelectionRef,
    selectionPreview,
    setPoemMode,
    setCropMode,
    scrollToPage,
    markBar,
    toolRail,
    renderPageNav,
    renderPageStack,
  } = wb;

  // Abre el Vollbild. Siembra contentHtml desde el textarea si el publilab aún
  // no es la fuente de verdad, para no perder lo ya recolectado.
  const openBodyFullscreen = () => {
    if (!pdfDoc) return;
    if (!publilabOn) setContentHtml(bodyTextToHtml(content));
    setBodyFullscreen(true);
    // El Vorspann no está visible en el Vollbild — si quedó como campo
    // activo, un "Textbereich" ahí adentro iría a un campo fuera de vista.
    activeFieldRef.current = "body";
    // Saltar directo a la página de inicio ya cargada en "Seiten", en vez de
    // arrancar siempre en la página 1 y tener que scrollear a mano.
    if (bodyFrom) wb.jumpToPageWhenReady(fsScrollRef, bodyFrom);
  };
  // Al cerrar, el publilab pasa a ser la fuente de verdad en la vista normal.
  const closeBodyFullscreen = () => {
    setBodyFullscreen(false);
    setPublilabOn(true);
    // El Modo Poema solo tiene sentido insertando texto en el cuerpo del
    // Vollbild — nada lo apagaba solo, así que si te olvidabas de tocar el
    // botón, seguía activo al volver al esqueleto del artículo (Titel,
    // Zusatzinfo, etc.) y arruinaba la próxima extracción normal sin avisar.
    setPoemMode(false);
  };

  // Añade un autor por nombre (lo crea si no existe). Reutilizable: lo usan
  // tanto el botón "← Auswahl" como la estructuración con Claude.
  const addAuthorByName = useCallback(
    async (rawName) => {
      const name = (rawName || "").trim();
      if (!name) return;
      setAuthorBusy(true);
      try {
        const existing = authorsCache.find(
          (a) => a.name.toLowerCase() === name.toLowerCase()
        );
        let author = existing;
        if (!author) {
          const res = await fetch("/api/authors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) throw new Error("create author failed");
          author = await res.json();
          setAuthorsCache((prev) => [...prev, author]);
        }
        setSelAuthors((prev) =>
          prev.some((a) => a.id === author.id) ? prev : [...prev, author]
        );
      } catch (err) {
        console.error(err);
        setError("Autor konnte nicht angelegt werden.");
      } finally {
        setAuthorBusy(false);
      }
    },
    [authorsCache]
  );

  const takeAuthor = useCallback(
    () => addAuthorByName(cleanAuthorName(lastSelectionRef.current)),
    [addAuthorByName, lastSelectionRef]
  );

  // Añade un/a entrevistado/a por nombre (lo crea si no existe). Mismo patrón
  // que addAuthorByName, pero sin cache local previa — el POST a
  // /api/interviewees ya hace el check-existe-o-crea del lado del servidor
  // (findUnique por name), así que alcanza con deduplicar contra la selección
  // actual del multi-select.
  const addIntervieweeByName = useCallback(async (rawName) => {
    const name = (rawName || "").trim();
    if (!name) return;
    setIntervieweeBusy(true);
    try {
      const res = await fetch("/api/interviewees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("create interviewee failed");
      const interviewee = await res.json();
      setSelInterviewees((prev) =>
        prev.some((i) => i.value === interviewee.id)
          ? prev
          : [...prev, { value: interviewee.id, label: interviewee.name }]
      );
    } catch (err) {
      console.error(err);
      setError("Gesprächspartner:in konnte nicht angelegt werden.");
    } finally {
      setIntervieweeBusy(false);
    }
  }, []);

  // "← Auswahl": toma la selección nativa del PDF (lastSelectionRef, igual
  // fuente que takeAuthor) y la usa como Gesprächspartner:in. Reusa
  // cleanAuthorName porque el problema que resuelve (versalitas/drop-cap del
  // OCR, prefijo de crédito suelto) es el mismo para cualquier nombre propio
  // seleccionado del PDF, no específico de autoría.
  const takeInterviewee = useCallback(
    () => addIntervieweeByName(cleanAuthorName(lastSelectionRef.current)),
    [addIntervieweeByName, lastSelectionRef]
  );

  // Buscador de autores (igual que Regionen/Themen): si no hay match exacto,
  // ofrece "➕ Neu anlegen" al final de la lista — mismo comportamiento
  // check-existe-o-crea que "← Auswahl", pero sin depender de la selección
  // del PDF.
  // async: AsyncSelect espera que loadOptions devuelva una Promise (igual que
  // loadRegions/loadTopics) — una función sync que devuelve un array plano
  // deja el spinner de carga colgado para siempre, porque el array no tiene
  // .then().
  const loadAuthorOptions = async (inputValue) => {
    const q = (inputValue || "").trim();
    const flat = authorsCache.map((a) => ({ value: a.id, label: a.name }));
    const ranked = q ? rankOptions(flat, q) : flat.slice(0, 50);
    if (!q) return ranked;
    const norm = (s) => (s || "").trim().toLowerCase();
    const hasExact = flat.some((o) => norm(o.label) === norm(q));
    const maybeCreate = hasExact
      ? []
      : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
    return [...maybeCreate, ...ranked];
  };

  const handleAuthorSelectChange = (selectedOptions) => {
    const opts = selectedOptions || [];
    const last = opts[opts.length - 1];
    if (last?.value === "new") {
      addAuthorByName(last.__inputValue || last.label);
      return;
    }
    const byId = new Map(authorsCache.map((a) => [a.id, a]));
    setSelAuthors(
      opts.map((o) => byId.get(o.value) || { id: o.value, name: o.label })
    );
  };

  // Buscador de entrevistados (igual patrón que Themen: búsqueda en el
  // servidor con /api/interviewees?search=, "➕ Neu anlegen" si no hay match
  // exacto; el POST ya hace check-existe-o-crea del lado del servidor).
  const loadIntervieweeOptions = async (inputValue) => {
    const q = (inputValue || "").trim();
    try {
      const res = await fetch(`/api/interviewees?search=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = await res.json();
      const flat = data.map((i) => ({ value: i.id, label: i.name }));
      if (!q) return flat;
      const norm = (s) => (s || "").trim().toLowerCase();
      const hasExact = flat.some((o) => norm(o.label) === norm(q));
      const maybeCreate = hasExact
        ? []
        : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
      return [...maybeCreate, ...flat];
    } catch {
      return [];
    }
  };

  // Misma dinámica que handleAuthorSelectChange: al elegir "➕ Neu anlegen" no
  // se toca selInterviewees acá (el "new" sentinel nunca entra al estado) —
  // se delega TODO a addIntervieweeByName, que hace el POST y ya se encarga
  // de agregarlo a la selección. Antes esta función tenía su propio POST
  // duplicado e inconsistente: si fallaba, revertía en silencio sin avisar
  // nada (no llamaba a setError), así que un fallo de red se sentía como
  // "no se puede crear" sin ninguna pista de qué pasó. Con addIntervieweeByName
  // el error queda visible igual que con Autor:in.
  const handleIntervieweeSelectChange = (selectedOptions) => {
    const opts = selectedOptions || [];
    const last = opts[opts.length - 1];
    if (last?.value === "new") {
      addIntervieweeByName(last.__inputValue || last.label);
      return;
    }
    setSelInterviewees(opts);
  };

  // ── Klassifizierung (mismo comportamiento que ArticleFormV2) ──────────────
  const toggleCategory = (categoryId) => {
    setSelCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const loadRegions = async (inputValue) => {
    try {
      const res = await fetch("/api/regions");
      if (!res.ok) return [];
      const flat = flattenTreeOptions(await res.json());
      const q = (inputValue || "").trim();
      if (!q) return flat.slice(0, 50);
      // "➕ Neu anlegen" como en Themen/Autor:in (handleRegionChange ya sabía
      // crearla, pero la opción nunca se ofrecía). El label trae la ruta
      // completa ("Südamerika > Uruguay"): se compara también contra el
      // último tramo para no ofrecer duplicar una región que ya existe.
      const norm = (s) => (s || "").trim().toLowerCase();
      const hasExact = flat.some(
        (o) =>
          norm(o.label) === norm(q) ||
          norm(o.label.split(" > ").pop()) === norm(q)
      );
      const maybeCreate = hasExact
        ? []
        : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
      return [...maybeCreate, ...rankOptions(flat, q)];
    } catch {
      return [];
    }
  };

  const loadTopics = async (inputValue) => {
    const q = (inputValue || "").trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/topics?search=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const flat = flattenTreeOptions(await res.json());
      const ranked = rankOptions(flat, q);
      const norm = (s) => (s || "").trim().toLowerCase();
      const hasExact = flat.some((o) => norm(o.label) === norm(q));
      const maybeCreate = hasExact
        ? []
        : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
      return [...maybeCreate, ...ranked];
    } catch {
      return [];
    }
  };

  const handleRegionChange = async (selectedOptions) => {
    const last = selectedOptions?.[selectedOptions.length - 1];
    if (last?.value === "new") {
      const rawName = last.__inputValue || last.label;
      try {
        const res = await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        if (res.ok) {
          const created = await res.json();
          setSelRegions([
            ...selectedOptions.slice(0, -1),
            { value: created.id, label: created.name },
          ]);
          return;
        }
      } catch {}
      setSelRegions(selectedOptions.slice(0, -1));
    } else {
      setSelRegions(selectedOptions || []);
    }
  };

  const handleTopicChange = async (selectedOptions) => {
    const last = selectedOptions?.[selectedOptions.length - 1];
    if (last?.value === "new") {
      const rawName = last.__inputValue || last.label;
      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        if (res.ok) {
          const created = await res.json();
          setSelTopics([
            ...selectedOptions.slice(0, -1),
            { value: created.id, label: created.name },
          ]);
          return;
        }
      } catch {}
      setSelTopics(selectedOptions.slice(0, -1));
    } else {
      setSelTopics(selectedOptions || []);
    }
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const updateImageField = (id, field, value) => {
    setImages((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: value } : x))
    );
  };

  // El publilab pide insertar una recortada inline: la subimos al servidor para
  // tener URL persistente, marcamos el rol "text" (sale de la galería principal)
  // y devolvemos la URL final para que el editor la embeba.
  const handleInsertAvailable = useCallback(
    async (id) => {
      // Imagen del módulo estándar (id local "new-…"): subir, registrar como
      // inline y sacarla de la galería (ya no es imagen principal).
      if (typeof id === "string" && id.startsWith("new-")) {
        const gImg = gallery.find((x) => x._localId === id);
        if (!gImg?.file) return null;
        try {
          const fd = new FormData();
          fd.append("file", gImg.file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || "Upload-Fehler");
          setInlineGalleryUrls((prev) => [...prev, data.url]);
          setGallery((prev) => prev.filter((x) => x._localId !== id));
          return data.url;
        } catch (err) {
          console.error("Inline-Upload fehlgeschlagen:", err);
          setError("Das Bild konnte nicht hochgeladen werden.");
          return null;
        }
      }
      const img = images.find((x) => x.id === id);
      if (!img) return null;
      try {
        const fd = new FormData();
        fd.append("file", img.file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "Upload-Fehler");
        setImages((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, role: "text", uploadedUrl: data.url } : x
          )
        );
        return data.url;
      } catch (err) {
        console.error("Inline-Upload fehlgeschlagen:", err);
        setError("Das Bild konnte nicht hochgeladen werden.");
        return null;
      }
    },
    [images, gallery]
  );

  // Botón propio de from-pdf al final de la barra de navegación del visor.
  const dossierSwitchButton = (
    <button
      type="button"
      onClick={() => {
        // El formulario (título/contenido/imágenes) NO se borra al cambiar
        // de dossier — solo advertir si ya hay algo escrito, para no
        // confundirse mirando un PDF distinto con datos de otro artículo.
        if (
          (title.trim() || hasBody) &&
          !confirm(
            "Es gibt schon Angaben für diesen Artikel. Trotzdem das Dossier wechseln?"
          )
        )
          return;
        openDossierPicker();
      }}
      className="ml-auto text-xs px-2 py-1 border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
      title="Anderes Dossier öffnen, ohne zurückzugehen"
    >
      🔁 Dossier wechseln
    </button>
  );

  const selectedBeitragstyp = beitragstypen.find(
    (b) => String(b.id) === String(beitragstypId)
  );
  // Igual criterio que ArticleFormV2: el Beitragstyp "Interview" habilita el
  // campo de entrevistado/a.
  const isInterview = selectedBeitragstyp?.name === "Interview";

  // Datos del artículo para la Vorschau completa del publilab (ArticlePreview):
  // lo que el formulario ya tiene cargado, con la forma que espera la vista.
  // Imágenes en el mismo orden con que se crean al guardar (ver handleSubmit):
  // primero las del módulo estándar, después los recortes "haupt" del PDF.
  const previewEdition = editions.find((ed) => String(ed.id) === String(editionId));
  const previewSubtyp = selectedBeitragstyp?.subtypes?.find(
    (st) => String(st.id) === String(beitragssubtypId)
  );
  // Las opciones de Regionen/Themen vienen como "Padre > Hijo"; la web
  // muestra solo el nombre.
  const lastLabel = (label) => String(label || "").split(" > ").pop();
  const previewMeta = {
    variant: editionId ? "ausgaben" : "online",
    date: publicationDate,
    title,
    subtitle,
    vorspannHtml: previewText,
    additionalInfoHtml: additionalInfo,
    beitragstyp: selectedBeitragstyp?.name || "",
    beitragssubtyp: previewSubtyp?.name || "",
    edition: previewEdition
      ? { number: previewEdition.number, title: previewEdition.title }
      : null,
    authors: selAuthors.map((a) => a.name),
    interviewees: selInterviewees.map((i) => i.label),
    regions: selRegions.map((r) => ({ id: r.value, name: lastLabel(r.label) })),
    topics: selTopics.map((t) => ({ id: t.value, name: lastLabel(t.label) })),
    categories: categories
      .filter((c) => selCategories.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name })),
    images: [
      ...galleryPreviews.map((img) => ({ url: img.url, alt: img.alt, title: img.title })),
      ...images
        .filter((img) => img.role === "haupt")
        .map((img) => ({ url: img.url, alt: img.alt, title: img.title })),
    ],
  };

  // Cuerpo válido: en modo publilab cuenta el HTML (sin tags); si no, el texto.
  const hasBody = publilabOn
    ? contentHtml.replace(/<[^>]+>/g, "").trim().length > 0
    : content.trim().length > 0;
  // Vista previa del cuerpo en la tarjeta de entrada al publilab.
  const bodyPreviewHtml = publilabOn ? contentHtml : bodyTextToHtml(content);
  const bodyTextLen = bodyPreviewHtml.replace(/<[^>]+>/g, "").trim().length;
  const canSubmit = title.trim() && hasBody && beitragstypId && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    clearBannerTimers();
    setBannerFading(false);
    setBannerPhase("uploading");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      // Sin esto el backend no genera el log de actividad CREATE_ARTICLE
      // (ver /api/articles/route.js: solo loguea si viene "userId").
      if (session?.user?.id) fd.append("userId", session.user.id);
      // Marca para métricas: este artículo se transcribió con el tool from-pdf.
      fd.append("createdFromPdf", "true");
      // Fecha elegida en el campo "Datum" — pasado/hoy publica de inmediato,
      // futuro deja el artículo programado (mismo criterio que new/page.js).
      const pubDate = publicationDate ? new Date(publicationDate) : new Date();
      fd.append("isPublished", String(pubDate <= new Date()));
      fd.append("publicationDate", pubDate.toISOString());
      // En modo publilab el cuerpo ya es HTML; si no, se convierte el texto.
      fd.append("content", publilabOn ? contentHtml : bodyTextToHtml(content));
      fd.append("beitragstypId", String(beitragstypId));
      if (beitragssubtypId) fd.append("beitragssubtypId", String(beitragssubtypId));
      if (subtitle.trim()) fd.append("subtitle", subtitle.trim());
      if (previewText.trim()) fd.append("previewText", previewText.trim());
      // Quill vacío produce "<p><br></p>"; solo enviar si hay texto real.
      if (additionalInfo.replace(/<[^>]+>/g, "").trim())
        fd.append("additionalInfo", additionalInfo.trim());
      if (editionId) {
        fd.append("isPrinted", "true");
        fd.append("editionId", String(editionId));
        if (bodyFrom) fd.append("startPage", String(bodyFrom));
        if (bodyTo) fd.append("endPage", String(bodyTo));
      }
      // Primero las imágenes del módulo estándar (archivos subidos), después los
      // recortes "haupt" del PDF — el orden define cuál es la imagen principal.
      // Los recortes "text" ya están subidos y embebidos en el contenido.
      const galleryEntries = [
        ...gallery
          .filter((img) => img.file)
          .map((img) => ({
            file: img.file,
            title: img.title || "",
            alt: img.alt || "",
            displayMode: img.displayMode || "",
          })),
        ...images
          .filter((img) => img.role === "haupt")
          .map((img) => ({ file: img.file, title: img.title, alt: img.alt, displayMode: "" })),
      ];
      galleryEntries.forEach((img, i) => {
        fd.append(`gallery[${i}][file]`, img.file);
        if (img.title.trim()) fd.append(`gallery[${i}][title]`, img.title.trim());
        if (img.alt.trim()) fd.append(`gallery[${i}][alt]`, img.alt.trim());
        if (img.displayMode) fd.append(`gallery[${i}][displayMode]`, img.displayMode);
      });
      // Imágenes insertadas dentro del texto (recortes "Im Text" + módulo
      // estándar) → Image ARTICLE_INLINE, como en el editor normal. Antes no
      // se mandaba y esas imágenes quedaban sin registrar.
      const inlineUrls = [
        ...images.filter((img) => img.role === "text" && img.uploadedUrl).map((img) => img.uploadedUrl),
        ...inlineGalleryUrls,
      ];
      if (inlineUrls.length > 0) fd.append("inlineImageUrls", JSON.stringify(inlineUrls));
      fd.append("authors", JSON.stringify(selAuthors.map((a) => a.id)));
      if (isInterview)
        fd.append(
          "interviewees",
          JSON.stringify(selInterviewees.map((i) => i.value))
        );
      fd.append("categories", JSON.stringify(selCategories));
      fd.append("regions", JSON.stringify(selRegions.map((r) => r.value)));
      fd.append("topics", JSON.stringify(selTopics.map((t) => t.value)));

      const res = await fetch("/api/articles", { method: "POST", body: fd });
      if (!res.ok) throw new Error("create failed");
      await res.json();
      if (editionId) refreshExistingArticles(editionId);

      // Página donde terminó el artículo recién creado (o donde empezó, si no
      // se cargó "Bis") — el siguiente casi siempre arranca en la página
      // siguiente. Se guarda ANTES de resetear el formulario.
      const lastPage = Number(bodyTo) || Number(bodyFrom) || null;
      const nextPage = lastPage
        ? Math.min(numPages || lastPage + 1, lastPage + 1)
        : null;

      // Deja el dossier/PDF abiertos (pdfDoc, editionId) y solo limpia los
      // campos propios del artículo — mismo criterio que tenía el viejo botón
      // "+ Nächster Artikel", ahora automático en cada creación.
      // "Seiten" (Von) se precarga con la página siguiente a donde terminó
      // este artículo — el siguiente suele arrancar ahí; "Bis" queda vacío
      // para que se cargue solo si el artículo ocupa más de una página.
      // "Datum" NO se resetea a hoy: casi todos los artículos de un mismo
      // dossier comparten fecha, así se evita reabrir el date picker cada vez.
      if (nextPage) { setBodyFrom(String(nextPage)); setBodyTo(""); }
      setTitle(""); setSubtitle(""); setPreviewText("");
      setAdditionalInfo(""); setContent("");
      setPublilabOn(false); setContentHtml("");
      setSelAuthors([]); setSelInterviewees([]); setSelCategories([]); setSelRegions([]); setSelTopics([]);
      setCropMode(false);
      images.forEach((img) => URL.revokeObjectURL(img.url));
      setImages([]);
      setGallery([]);
      setInlineGalleryUrls([]);

      // Secuencia del bannerchen: "hinzugefügt!" un momento, después "zurück
      // zum Dossier" (recién ahí scrollea, para que el texto coincida con lo
      // que pasa en pantalla), después se desvanece (transición de opacity,
      // no un unmount seco) y desaparece del todo.
      setBannerPhase("success");
      bannerTimersRef.current.push(
        setTimeout(() => {
          setBannerPhase("returning");
          if (nextPage) scrollToPage(scrollRef, nextPage);
        }, 900)
      );
      bannerTimersRef.current.push(setTimeout(() => setBannerFading(true), 1900));
      bannerTimersRef.current.push(
        setTimeout(() => {
          setBannerPhase(null);
          setBannerFading(false);
        }, 2400)
      );
    } catch (err) {
      console.error(err);
      setError("Der Artikel konnte nicht angelegt werden.");
      clearBannerTimers();
      setBannerPhase(null);
      setBannerFading(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="px-4 pt-4">
        <div className="h-[3px] w-16 mb-2" style={{ background: "#BD0E0D" }} />
        <h1
          className="text-2xl font-black tracking-tight text-gray-800"
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
        >
          PDF → Artikel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Dossier öffnen, Text markieren und den Feldern zuordnen. Der Fließtext
          wird über den Seitenbereich automatisch extrahiert.
        </p>
      </div>

      {/* Bannerchen central tras "Artikel anlegen": avanza solo por las fases
          hochladen → hinzugefügt! → zurück zum Dossier, y se desvanece —
          no tapa el panel, el dossier sigue abierto para el siguiente
          Artikel (ver handleSubmit para la secuencia/timers). */}
      {bannerPhase && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500 ease-out ${
            bannerFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-200 shadow-xl">
            {bannerPhase === "uploading" && (
              <span className="h-4 w-4 border-2 border-[#BD0E0D]/25 border-t-[#BD0E0D] rounded-full animate-spin shrink-0" />
            )}
            {bannerPhase === "success" && (
              <span className="h-5 w-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0 animate-scaleIn">
                ✓
              </span>
            )}
            {bannerPhase === "returning" && (
              <span className="text-base shrink-0 animate-scaleIn">↩️</span>
            )}
            <span key={bannerPhase} className="text-sm font-medium text-gray-700 animate-fadeIn whitespace-nowrap">
              {bannerPhase === "uploading" && "Artikel wird hinzugefügt …"}
              {bannerPhase === "success" && "Artikel hinzugefügt!"}
              {bannerPhase === "returning" && "Zurück zum Dossier …"}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* ── Panel PDF ─────────────────────────────────────── */}
          <div className="lg:w-1/2 flex flex-col">
            {!pdfDoc ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openDossierPicker}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-[#BD0E0D] text-white text-sm font-medium cursor-pointer hover:bg-[#A30C0B] transition-colors w-max"
                >
                  <span>📚 Aus PDF-Abo wählen</span>
                </button>
              </div>
            ) : (
              <>
                {/* Artículos ya cargados en este dossier — para chequear contra
                    el índice antes de transcribir uno que ya existe. */}
                {editionId && (
                  <div className="mb-2 border border-gray-200 bg-white text-xs">
                    <button
                      type="button"
                      onClick={() => setExistingOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <span>
                        📋 Bereits im Dossier:{" "}
                        {loadingExisting ? "…" : existingArticles.length}
                      </span>
                      <span>{existingOpen ? "▲" : "▼"}</span>
                    </button>
                    {existingOpen &&
                      (loadingExisting ? (
                        <p className="px-2 pb-2 text-gray-400">Lade…</p>
                      ) : existingArticles.length === 0 ? (
                        <p className="px-2 pb-2 text-gray-400">
                          Noch keine Artikel geladen.
                        </p>
                      ) : (
                        <ul className="max-h-40 overflow-auto divide-y divide-gray-100 border-t border-gray-100">
                          {existingArticles.map((a) => (
                            <li
                              key={a.id}
                              className="px-2 py-1 flex items-center justify-between gap-2"
                            >
                              <span className="truncate text-gray-700" title={a.title}>
                                {a.title}
                                {a.authors?.length > 0 && (
                                  <span className="text-gray-400">
                                    {" "}
                                    — {a.authors.map((au) => au.name).join(", ")}
                                  </span>
                                )}
                              </span>
                              {!a.isPublished && (
                                <span className="shrink-0 text-[10px] px-1 bg-yellow-100 text-yellow-700">
                                  Entwurf
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ))}
                  </div>
                )}

                {renderPageNav(scrollRef, dossierSwitchButton)}

                {markBar}

                <div className="flex gap-2 items-start">
                  <div className="sticky top-20 self-start z-20 shrink-0">
                    {toolRail}
                  </div>
                  <div
                    ref={scrollRef}
                    className="flex-1 min-w-0 overflow-auto border border-gray-100 bg-gray-50 p-3 max-h-[78vh]"
                  >
                    {renderPageStack(scrollRef)}
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 min-h-[1.5em]">
                  {selectionPreview ? (
                    <>
                      Auswahl: <span className="text-gray-700">“{selectionPreview}{selectionPreview.length >= 140 ? "…" : ""}”</span>
                    </>
                  ) : (
                    "Markiere Text im PDF und weise ihn rechts einem Feld zu."
                  )}
                </div>
              </>
            )}
            {loading && (
              <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
                PDF wird geladen…
              </p>
            )}
          </div>

          {/* ── Panel Formulario ──────────────────────────────── */}
          <div className="lg:w-1/2 flex flex-col gap-4">
            {fileName && (
              <p className="text-xs text-gray-400 truncate">{fileName}</p>
            )}

            {/* ── Seiten (Referenz für die gedruckte Ausgabe: startPage/endPage) ── */}
            <div className="border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                <span className="font-medium text-gray-700">Seiten</span>
                <input
                  type="number"
                  min={1}
                  max={numPages || undefined}
                  placeholder="1"
                  value={bodyFrom}
                  onChange={(e) => setBodyFrom(e.target.value)}
                  className="w-14 border border-gray-300 px-1 py-0.5 text-center text-gray-700"
                />
                <span>–</span>
                <input
                  type="number"
                  min={1}
                  max={numPages || undefined}
                  placeholder={String(numPages || 1)}
                  value={bodyTo}
                  onChange={(e) => setBodyTo(e.target.value)}
                  className="w-14 border border-gray-300 px-1 py-0.5 text-center text-gray-700"
                />
              </div>
            </div>

            {/* Edición + tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Dossier (Ausgabe)
                </label>
                <select
                  value={editionId}
                  onChange={(e) => setEditionId(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— wählen —</option>
                  {editions.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.number ? `Nr. ${ed.number}` : `#${ed.id}`}
                      {ed.title ? ` · ${ed.title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Beitragstyp <span className="text-[#BD0E0D]">*</span>
                </label>
                <select
                  value={beitragstypId}
                  onChange={(e) => {
                    setBeitragstypId(e.target.value);
                    setBeitragssubtypId("");
                  }}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— wählen —</option>
                  {beitragstypen.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBeitragstyp?.subtypes?.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Subtyp
                </label>
                <select
                  value={beitragssubtypId}
                  onChange={(e) => setBeitragssubtypId(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— optional —</option>
                  {selectedBeitragstyp.subtypes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <PdfField label="Titel" value={title} onChange={setTitle} onTake={takeInto(setTitle)} getSelection={() => cleanSelection(lastSelectionRef.current)} onFocusField={() => { activeFieldRef.current = "title"; }} required />
            <PdfField label="Untertitel" value={subtitle} onChange={setSubtitle} onTake={takeInto(setSubtitle)} getSelection={() => cleanSelection(lastSelectionRef.current)} onFocusField={() => { activeFieldRef.current = "subtitle"; }} />

            {/* Antes fija a "ahora" sin poder cambiarla — pasado/hoy publica
                de inmediato, futuro programa el artículo. */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Datum
              </label>
              <input
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                className="border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
              />
            </div>
            {/* Vorspann con QuillEditor (negrita/cursiva/link/dossier), igual que
                el resto de los formularios — antes era un textarea plano sin
                ningún formato. "← Auswahl" reemplaza el contenido, "＋ einfügen"
                agrega la selección al final (con Quill no hay caret a seguir).
                onFocus (con bubbling desde el contenteditable de Quill) marca
                este campo como destino del "Textbereich" del PDF. */}
            <div onFocus={() => { activeFieldRef.current = "vorspann"; }}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Vorspann</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const sel = cleanSelection(lastSelectionRef.current);
                      if (sel)
                        setPreviewText(
                          stripTrailingEmptyParagraph(previewText) +
                            `<p>${escapeHtml(sel)}</p>`
                        );
                    }}
                    className="text-xs px-2 py-0.5 border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
                    title="PDF-Auswahl ans Ende anhängen"
                  >
                    ＋ einfügen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = cleanSelection(lastSelectionRef.current);
                      if (sel) setPreviewText(`<p>${escapeHtml(sel)}</p>`);
                    }}
                    className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    title="Aktuelle PDF-Auswahl übernehmen (ersetzt das Feld)"
                  >
                    ← Auswahl
                  </button>
                </div>
              </div>
              <QuillEditor
                value={previewText}
                onChange={setPreviewText}
                toolbar={VORSPANN_TOOLBAR}
              />
            </div>

            {/* Autor: buscador con check-existe-o-crea (igual que Regionen/
                Themen) + botón rápido para tomar la selección del PDF. Los
                chips seleccionados los muestra el propio AsyncSelect (isMulti).
                onFocus (bubbling desde el input interno del AsyncSelect) lo
                marca como destino del "Textbereich" del PDF. */}
            <div onFocus={() => { activeFieldRef.current = "author"; }}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Autor:in</label>
                <button
                  type="button"
                  onClick={takeAuthor}
                  disabled={authorBusy}
                  className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  title="Auswahl als Autor übernehmen (anlegen falls neu)"
                >
                  {authorBusy ? "…" : "← Auswahl"}
                </button>
              </div>
              <AsyncSelect
                instanceId="from-pdf-author"
                inputId="from-pdf-author-select"
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadAuthorOptions}
                onChange={handleAuthorSelectChange}
                value={selAuthors.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="Autor:in suchen oder neu anlegen…"
              />
            </div>

            {/* Entrevistado/a — solo si el Beitragstyp elegido es "Interview",
                igual que ArticleFormV2. Mismo patrón de buscador que Autor:in
                (multi + "➕ Neu anlegen" en el propio select si no hay match),
                y ahora también el mismo atajo "← Auswahl" que Autor:in:
                marcar texto del PDF y tomarlo directo, sin tipear a mano. */}
            {isInterview && (
              <div onFocus={() => { activeFieldRef.current = "interviewee"; }}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">
                    Gesprächspartner:in
                  </label>
                  <button
                    type="button"
                    onClick={takeInterviewee}
                    disabled={intervieweeBusy}
                    className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                    title="Auswahl als Gesprächspartner:in übernehmen (anlegen falls neu)"
                  >
                    {intervieweeBusy ? "…" : "← Auswahl"}
                  </button>
                </div>
                <AsyncSelect
                  instanceId="from-pdf-interviewee"
                  inputId="from-pdf-interviewee-select"
                  isMulti
                  cacheOptions
                  defaultOptions
                  loadOptions={loadIntervieweeOptions}
                  onChange={handleIntervieweeSelectChange}
                  value={selInterviewees}
                  placeholder="Gesprächspartner:in suchen oder neu anlegen…"
                />
              </div>
            )}

            {/* Módulo estándar de imágenes (mismo que el editor normal) */}
            <ImageGalleryManager
              gallery={gallery}
              setGallery={setGallery}
              onFieldFocus={(index, field) => {
                activeFieldRef.current = `galleryImg:${index}:${field}`;
              }}
            />

            {/* Imágenes recortadas del PDF */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Bilder (aus PDF){" "}
                {images.length > 0 && (
                  <span className="text-gray-400 font-normal">
                    · {images.length}
                    {gallery.length === 0 && " · erstes „Hauptbild“ = Titelbild"}
                    {" "}· „Im Text“ = im publilab eingefügt
                  </span>
                )}
              </label>
              {images.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="flex gap-3 border border-gray-200 p-2 bg-white"
                    >
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=""
                          className="h-24 w-auto border border-gray-300 object-contain bg-white"
                        />
                        <span className="absolute bottom-0 left-0 text-[10px] bg-black/60 text-white px-1">
                          S. {img.page}
                        </span>
                        {img.role === "text" ? (
                          <span className="absolute top-0 left-0 text-[10px] bg-blue-600 text-white px-1">
                            Im Text
                          </span>
                        ) : (
                          gallery.length === 0 &&
                          images.find((x) => x.role === "haupt")?.id ===
                            img.id && (
                            <span className="absolute top-0 left-0 text-[10px] bg-[#BD0E0D] text-white px-1">
                              Hauptbild
                            </span>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-[#BD0E0D] text-white text-xs leading-none flex items-center justify-center hover:bg-[#a50c0b]"
                          aria-label="Bild entfernen"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        {img.role === "text" ? (
                          <p className="text-xs text-gray-400 self-center">
                            Im Fließtext eingebettet (publilab).
                          </p>
                        ) : (
                          <>
                            <input
                              value={img.title}
                              onChange={(e) =>
                                updateImageField(img.id, "title", e.target.value)
                              }
                              onFocus={() => {
                                activeFieldRef.current = `cropImg:${img.id}:title`;
                              }}
                              placeholder="Titel (Bildunterschrift)"
                              className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#BD0E0D]"
                            />
                            <input
                              value={img.alt}
                              onChange={(e) =>
                                updateImageField(img.id, "alt", e.target.value)
                              }
                              onFocus={() => {
                                activeFieldRef.current = `cropImg:${img.id}:alt`;
                              }}
                              placeholder="Alt-Text (Beschreibung für Screenreader)"
                              className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#BD0E0D]"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Mit „🖼 Bild ausschneiden“ zwei Ecken im PDF anklicken.
                </p>
              )}
            </div>

            {/* onFocus (bubbling desde el contenteditable de Quill) marca este
                campo como destino del "Textbereich" del PDF, igual que Vorspann. */}
            <div onFocus={() => { activeFieldRef.current = "additionalInfo"; }}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Zusatzinfo
              </label>
              <QuillEditor value={additionalInfo} onChange={setAdditionalInfo} />
            </div>

            {/* Klassifizierung — mismo comportamiento que ArticleFormV2 */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Kategorien
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {categories.map((category) => (
                    <CheckboxField
                      key={category.id}
                      id={`category-${category.id}`}
                      label={category.name}
                      checked={selCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Regionen
                  </label>
                  <AsyncSelect
                    instanceId="from-pdf-region"
                    inputId="from-pdf-region-select"
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={loadRegions}
                    onChange={handleRegionChange}
                    value={selRegions}
                    placeholder="Region suchen…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Themen
                  </label>
                  <AsyncSelect
                    instanceId="from-pdf-topic"
                    inputId="from-pdf-topic-select"
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={loadTopics}
                    onChange={handleTopicChange}
                    value={selTopics}
                    placeholder="Thema suchen oder neu anlegen…"
                  />
                </div>
              </div>
            </div>

            {/* Cuerpo (Fließtext) — último paso: se edita en el publilab con el PDF al lado */}
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="text-xs font-medium text-gray-500">
                  Fließtext <span className="text-[#BD0E0D]">*</span>
                </label>
                {hasBody && (
                  <button
                    type="button"
                    onClick={() => {
                      setContent("");
                      setContentHtml("");
                      setPublilabOn(false);
                    }}
                    className="text-xs px-2 py-0.5 border border-gray-300 text-gray-500 hover:border-gray-500"
                  >
                    leeren
                  </button>
                )}
              </div>

              {hasBody ? (
                <div className="border border-gray-200 bg-white">
                  <div
                    className="article-content px-3 py-2 max-h-56 overflow-auto text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: bodyPreviewHtml }}
                  />
                  <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {bodyTextLen} Zeichen
                    </span>
                    <button
                      type="button"
                      onClick={openBodyFullscreen}
                      disabled={!pdfDoc}
                      className="text-xs px-3 py-1 bg-[#BD0E0D] text-white hover:bg-[#a50c0b] transition-colors disabled:opacity-40"
                    >
                      ✍️ Im publilab bearbeiten
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openBodyFullscreen}
                  disabled={!pdfDoc}
                  className="w-full border-2 border-dashed border-[#BD0E0D]/40 hover:border-[#BD0E0D] hover:bg-[#BD0E0D]/[0.03] transition-colors py-6 px-4 flex flex-col items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-bold text-[#BD0E0D]">
                    ✍️ Fließtext im publilab erfassen
                  </span>
                  <span className="text-xs text-gray-500 text-center max-w-md">
                    Öffnet das PDF links und den publilab rechts: Text markieren →
                    als Absatz, Zwischentitel oder Frage einfügen · Bilder einbetten
                    · alles mit System-Formatierung.
                  </span>
                </button>
              )}
            </div>

            {error && <p className="text-sm text-[#BD0E0D]">⚠ {error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 bg-[#BD0E0D] text-white text-sm font-bold hover:bg-[#a50c0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-max inline-flex items-center gap-2"
            >
              {submitting && (
                <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
              )}
              {submitting ? "Wird gespeichert…" : "Speichern"}
            </button>
          </div>
        </div>

      {/* ── Vollbild: publilab a pantalla completa con el PDF acoplado (split) ── */}
      {bodyFullscreen && pdfDoc && (
        <InterviewEditor
          splitMode
          apiRef={editorApi}
          value={contentHtml}
          onChange={setContentHtml}
          onClose={closeBodyFullscreen}
          title={title}
          subtitle={subtitle}
          previewMeta={previewMeta}
          availableImages={[
            ...images
              .filter((img) => img.role === "haupt")
              .map((img) => ({
                id: img.id,
                url: img.url,
                title: img.title,
                alt: img.alt,
              })),
            // Imágenes subidas con el módulo estándar (aún sin guardar).
            ...galleryPreviews,
          ]}
          onInsertAvailable={handleInsertAvailable}
          leftPanel={
            <DossierWorkbenchPanel
              wb={wb}
              scrollRef={fsScrollRef}
              navExtra={dossierSwitchButton}
            />
          }
        />
      )}

      {/* ── Selector de dossiers del módulo Digital-ABO ─────────── */}
      {dossierPickerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDossierPickerOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-800">
                📚 Dossier aus PDF-Abo wählen
              </span>
              <button
                type="button"
                onClick={() => setDossierPickerOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {loadingDossiers ? (
                <p className="p-6 text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
                  Dossiers werden geladen…
                </p>
              ) : dossiers.length === 0 ? (
                <p className="p-6 text-sm text-gray-500">
                  Noch keine Dossier-PDFs im Digital-Abo hochgeladen.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {dossiers.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => pickDossier(d)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-xs font-mono text-gray-400 shrink-0">
                          #{d.number}
                        </span>
                        <span className="text-sm text-gray-800">{d.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
