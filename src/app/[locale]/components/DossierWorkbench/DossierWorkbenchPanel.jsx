"use client";

// Layout del Dossier-PDF acoplado a la izquierda del publilab (leftPanel del
// InterviewEditor): navegación + zoom arriba, barra de herramientas al
// costado, páginas, vista previa de la selección y la barra flotante de
// inserción. Presentacional — todo el estado vive en useDossierWorkbench (`wb`).
// Lo usan Artikel aus PDF (Vollbild) y el editor de artículos, así se ven y
// funcionan idénticos.
export default function DossierWorkbenchPanel({ wb, scrollRef, navExtra = null }) {
  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-gray-50">
      <div className="px-3 py-1.5 border-b border-gray-200 bg-white">
        {wb.renderPageNav(scrollRef, navExtra)}
      </div>
      {wb.markBar}
      <div className="flex-1 flex min-h-0">
        <div className="shrink-0 p-1.5 border-r border-gray-200 bg-gray-50">
          {wb.toolRail}
        </div>
        <div ref={scrollRef} className="flex-1 min-w-0 overflow-auto p-3">
          {wb.renderPageStack(scrollRef)}
        </div>
      </div>
      <div className="px-3 py-1.5 border-t border-gray-200 bg-white text-xs text-gray-500 min-h-[1.6em]">
        {wb.selectionPreview ? (
          <>
            Auswahl:{" "}
            <span className="text-gray-700">
              “{wb.selectionPreview}
              {wb.selectionPreview.length >= 140 ? "…" : ""}”
            </span>
          </>
        ) : (
          "Markiere Text im PDF und füge ihn rechts als Block ein."
        )}
      </div>
      {/* Controles flotantes — anclados al visualViewport (persisten con zoom) */}
      <div
        ref={wb.floatBarRef}
        style={{
          position: "fixed",
          left: "50%",
          top: "auto",
          bottom: 20,
          transform: "translate(-50%, -100%)",
        }}
        className="z-[10000] flex items-center gap-2 bg-white/95 backdrop-blur border border-gray-300 shadow-lg rounded-full px-2 py-1.5"
      >
        <button
          type="button"
          onClick={wb.appendBodyToEditor}
          className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          title="Auswahl als Block(e) anhängen"
        >
          → Auswahl anhängen
        </button>
        <button
          type="button"
          onClick={wb.appendHeadingToEditor}
          className="text-xs px-3 py-1.5 border border-gray-800 text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
          title="Auswahl als Zwischentitel anhängen"
        >
          → Zwischentitel
        </button>
      </div>
    </div>
  );
}
