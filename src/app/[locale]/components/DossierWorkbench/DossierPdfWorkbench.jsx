"use client";

import { useState, useRef, useEffect } from "react";
import { loadPdfJs } from "@/lib/pdfCrop";
import useDossierWorkbench from "./useDossierWorkbench";
import DossierWorkbenchPanel from "./DossierWorkbenchPanel";

// Normaliza para comparar título vs texto del PDF (sin puntuación, espacios
// colapsados).
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

// Dossier-PDF para el editor de artículos (leftPanel del publilab): carga el
// PDF de la edición y monta la MISMA mesa de trabajo que Artikel aus PDF
// (useDossierWorkbench + DossierWorkbenchPanel). Abre en la página de inicio
// del artículo (startPage) o, si no está cargada, donde encuentre el título.
// Los recortes de imagen van a `onCropImage(file)` (la galería del formulario).
export default function DossierPdfWorkbench({
  pdfUrl,
  articleTitle,
  startPage,
  apiRef,
  onCropImage,
}) {
  const [pdfjs, setPdfjs] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageAspect, setPageAspect] = useState(1.414);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [notice, setNotice] = useState("");
  const scrollRef = useRef(null);

  const wb = useDossierWorkbench({
    pdfDoc,
    pdfjs,
    numPages,
    pageAspect,
    editorApiRef: apiRef,
    onCropImage: (file, url) => {
      URL.revokeObjectURL(url);
      onCropImage?.(file);
      setNotice("✓ Bild zur Galerie hinzugefügt");
    },
    onError: setNotice,
    floatBarActive: status === "ready",
  });

  useEffect(() => {
    loadPdfJs()
      .then(setPdfjs)
      .catch(() => setStatus("error"));
  }, []);

  // Carga el PDF y salta a la página del artículo. Solo al cambiar de PDF: no
  // volver a saltar cada vez que se edita el título.
  const titleRef = useRef(articleTitle);
  titleRef.current = articleTitle;
  const startPageRef = useRef(startPage);
  startPageRef.current = startPage;
  useEffect(() => {
    if (!pdfjs || !pdfUrl) return;
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error("fetch pdf failed");
        const buffer = await res.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        try {
          const vp = (await doc.getPage(1)).getViewport({ scale: 1 });
          setPageAspect(vp.height / vp.width);
        } catch {
          setPageAspect(1.414);
        }
        setStatus("ready");
        const sp = Number(startPageRef.current);
        const page =
          sp >= 1 && sp <= doc.numPages ? sp : await findTitlePage(doc, titleRef.current);
        if (cancelled) return;
        if (page) wb.jumpToPageWhenReady(scrollRef, page);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfjs, pdfUrl]);

  if (status !== "ready") {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        {status === "error" ? (
          "Das Dossier-PDF konnte nicht geladen werden."
        ) : (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
            Dossier-PDF wird geladen…
          </span>
        )}
      </div>
    );
  }

  return (
    <DossierWorkbenchPanel
      wb={wb}
      scrollRef={scrollRef}
      navExtra={
        notice ? (
          <span className="ml-auto text-xs text-gray-500">{notice}</span>
        ) : null
      }
    />
  );
}
