"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";

export default function NoArticlesAvailable({ edition }) {
  const locale = useLocale();
  const isSpanish = locale === "es";
  const [translatedEditions, setTranslatedEditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTranslatedEditions() {
      try {
        const res = await fetch("/api/editions?translated=true&sort=desc");
        const data = await res.json();
        // Mostrar máximo 6 ediciones
        setTranslatedEditions(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (error) {
        console.error("Error loading translated editions:", error);
        setTranslatedEditions([]);
      } finally {
        setLoading(false);
      }
    }

    loadTranslatedEditions();
  }, []);

  const getEditionTitle = (ed) => {
    if (isSpanish) {
      return ed.titleES || ed.title || "Sin título";
    }
    return ed.title || ed.titleES || "Ohne Titel";
  };

  return (
    <div className="col-span-full min-h-[500px] flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Card principal */}
        <div className="bg-gradient-to-br from-red-50 via-white to-rose-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl border border-red-100 dark:border-gray-700 overflow-hidden">
          {/* Header con icono grande */}
          <div className="relative px-8 py-12 text-center overflow-hidden">
            {/* Imagen de fondo con blur */}
            {edition?.coverImage && (
              <div
                className="absolute inset-0 bg-cover bg-center bg-top"
                style={{ backgroundImage: `url(${edition.coverImage})` }}
              >
                <div className="absolute inset-0 bg-red-600/40 dark:bg-red-800/50"></div>
              </div>
            )}

            {/* Fallback si no hay imagen */}
            {!edition?.coverImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-700 dark:to-rose-800"></div>
            )}
            <div className="absolute inset-0 opacity-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-4">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {isSpanish
                  ? "Contenido en traducción"
                  : "Inhalt wird übersetzt"}
              </h2>

              <p className="text-red-50 text-lg">
                {isSpanish
                  ? "Esta edición aún no está disponible en español"
                  : "Diese Ausgabe ist noch nicht auf Deutsch verfügbar"}
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6">
            {/* Mensaje principal */}
            <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {isSpanish
                    ? "Nuestro equipo está trabajando en ello"
                    : "Unser Team arbeitet daran"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {isSpanish
                    ? "El equipo de traductores de ila trabaja vigorosamente para hacer disponible este contenido en español. La traducción de cada edición es un proceso cuidadoso que requiere tiempo."
                    : "Das ila-Übersetzerteam arbeitet intensiv daran, diesen Inhalt auf Deutsch verfügbar zu machen. Die Übersetzung jeder Ausgabe ist ein sorgfältiger Prozess, der Zeit erfordert."}
                </p>
              </div>
            </div>

            {/* Ediciones traducidas */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-sm text-gray-500">
                  {isSpanish ? "Cargando ediciones..." : "Ausgaben laden..."}
                </p>
              </div>
            ) : translatedEditions.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {isSpanish
                    ? "Mientras tanto, explora estas ediciones ya traducidas:"
                    : "In der Zwischenzeit können Sie diese bereits übersetzten Ausgaben erkunden:"}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {translatedEditions.map((ed) => (
                    <Link
                      key={ed.id}
                      href={`/${locale}?edition=${ed.number}`}
                      className="group block"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                        <Image
                          src={ed.coverImage}
                          alt={`ila ${ed.number}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white font-bold text-sm">
                              ila {ed.number}
                            </p>
                            <p className="text-white/90 text-xs line-clamp-2 mt-1">
                              {getEditionTitle(ed)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer suave */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              {isSpanish
                ? "💡 Consejo: Click en cualquier portada para ver su contenido traducido"
                : "💡 Tipp: Klicken Sie auf ein Cover, um den übersetzten Inhalt anzuzeigen"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
