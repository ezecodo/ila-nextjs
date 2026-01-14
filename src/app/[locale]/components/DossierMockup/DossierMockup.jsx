import React from "react";
import styles from "../DossierMockup/DossierMockup.module.css"; // IMPORTANTE: Importar los estilos

export default function Book({ issue, isFlipped, onToggleFlip }) {
  return (
    <div
      className={`${styles.scene3d} w-full flex justify-center py-8 mb-8 min-h-[500px]`}
    >
      <div className={`${styles.bookContainer} relative`}>
        {/* Sombra Base */}
        <div
          className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/20 blur-xl rounded-[100%] transition-all duration-500 ${styles.bookShadow}`}
        ></div>

        <div className={`${styles.book} ${isFlipped ? styles.flipped : ""}`}>
          {/* Lomo */}
          <div className={styles.spine}></div>

          {/* Grosor páginas */}
          <div className={styles.pagesStack}></div>

          {/* CARA FRONTAL (PORTADA) */}
          <div className={`${styles.pageFace} ${styles.pageFront} relative`}>
            <div className={styles.lightEffect}></div>

            {/* Fondo dinámico (Tailwind + prop) */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${issue.color} transition-colors duration-700`}
            ></div>

            {/* Contenido Portada */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between text-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div
                    className={`${styles.fontSerifAlt} text-5xl font-bold tracking-tighter drop-shadow-md`}
                  >
                    ila
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.2em] opacity-80 mt-1">
                    DOSSIERS
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black opacity-90">
                    #{issue.id}
                  </div>
                  <div className="text-xs font-medium opacity-70 mt-1 uppercase tracking-wide">
                    {issue.month} {issue.year}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-px w-full bg-white/30"></div>
                <h2
                  className={`${styles.fontSerifAlt} text-4xl font-bold leading-tight`}
                >
                  {issue.title.toUpperCase()}
                </h2>
                <p className="text-lg font-light opacity-90 max-w-[80%]">
                  {issue.subtitle}
                  <br />
                  <span className="text-sm opacity-80 font-normal">
                    in Zeiten des Wandels
                  </span>
                </p>
              </div>

              <div className="flex justify-between items-end text-[10px] opacity-50 uppercase tracking-wider">
                <span>ISSN 0946-5057</span>
                <span>www.ila-dossiers.de</span>
              </div>
            </div>

            {/* Textura Papel */}
            <div
              className="absolute inset-0 opacity-10 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23000000' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E\")",
              }}
            ></div>
          </div>

          {/* CARA TRASERA (INTERIOR) */}
          <div
            className={`${styles.pageFace} ${styles.pageBack} bg-white p-8 flex flex-col relative`}
          >
            <div className={styles.shadowOverlay}></div>

            {/* Header Interior */}
            <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-center">
              <div>
                <div
                  className={`${styles.fontSerifAlt} text-red-700 font-bold text-xl`}
                >
                  ila
                </div>
                <div className="text-[10px] text-gray-400 font-bold tracking-widest">
                  DOSSIERS
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 text-lg">
                  #{issue.id}
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  {issue.month}
                </div>
              </div>
            </div>

            {/* Contenido Editorial */}
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-600 to-red-400"></div>

              <h3
                className={`${styles.fontSerifAlt} text-2xl font-bold text-gray-900 mb-6 pl-4`}
              >
                Inhalt & Analyse
              </h3>

              <div className="space-y-6 pl-4">
                <div>
                  <h4 className="font-bold text-red-700 mb-1 text-sm uppercase tracking-wide">
                    Hauptthema
                  </h4>
                  <p className="text-xl font-bold text-gray-800 leading-snug">
                    {issue.title}: {issue.subtitle}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-400 mb-2 text-xs uppercase tracking-wider">
                    Schwerpunkte
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 group cursor-pointer hover:bg-red-50 p-2 rounded transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 group-hover:scale-125 transition-transform"></span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          Der lange Weg zum Frieden
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Analyse der Verhandlungen
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 group cursor-pointer hover:bg-red-50 p-2 rounded transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 group-hover:scale-125 transition-transform"></span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          Indigener Widerstand
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Rolle der Ureinwohner
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Interior */}
            <div className="mt-auto pt-4 border-t border-gray-100 text-center">
              <button className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wide transition-colors">
                Vollständiges Artikelladen →
              </button>
            </div>
          </div>
        </div>

        {/* Etiqueta Nuevo */}
        {issue.isNew && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg transform rotate-12 z-30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-yellow-900 rounded-full animate-pulse"></span>
            NEUE AUSGABE
          </div>
        )}
      </div>
    </div>
  );
}
