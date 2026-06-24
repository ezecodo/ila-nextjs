"use client";

import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import ArticlesList from "../../components/ArticlesList/ArticlesList";
import GenericAdminListDossiers from "../../components/GenericAdminListDossiers/GenericAdminLIstDossiers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaRegFileAlt, FaCheckCircle, FaBook } from "react-icons/fa";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

export default function TranslatorAssignments() {
  const { data: session } = useSession();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState("articles");
  const [translated, setTranslated] = useState([]);
  const [translatedCount, setTranslatedCount] = useState(null);

  const userId = session?.user?.id;

  // ✅ Artículos ya revisados (approved) del traductor: alimentan el contador
  // de reconocimiento y la pestaña "Traducidos".
  useEffect(() => {
    if (!userId) return;
    const fetchTranslated = async () => {
      try {
        const params = new URLSearchParams({
          translatorId: userId,
          translated: "true",
          limit: "200",
        });
        const res = await fetch(`/api/articles/list?${params.toString()}`);
        if (!res.ok) throw new Error("Error al obtener traducidos");
        const data = await res.json();
        setTranslated(data.articles || []);
        setTranslatedCount(data.totalArticles ?? (data.articles?.length || 0));
      } catch (err) {
        console.error("❌ Error cargando traducidos:", err);
        setTranslatedCount(0);
      }
    };
    fetchTranslated();
  }, [userId]);

  if (!userId) {
    return (
      <p className="text-center text-gray-500 p-6">
        Debes iniciar sesión para ver tus asignaciones.
      </p>
    );
  }

  // 🔹 Columnas para dossiers
  const dossierColumns = [
    { key: "number", label: "N°" },
    {
      key: "title",
      label: "Título",
      format: (value, item) => (
        <Link
          href={`/editions/${item.id}`}
          target="_blank"
          className="text-blue-600 hover:underline font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "datePublished",
      label: "Fecha",
      format: (value) =>
        value
          ? new Date(value).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
            })
          : "-",
    },
    {
      key: "translationStatus",
      label: "Estado",
      format: (value) => {
        const map = {
          assigned: "🟢 Asignado",
          in_progress: "🟡 En curso",
          done: "✅ Terminado",
          not_assigned: "⚪ Sin asignar",
        };
        return map[value] || "—";
      },
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
        Equipo de traducción · ila
      </p>
      <h1
        className="mb-5 mt-1 text-3xl font-extrabold text-[#BD0E0D]"
        style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
      >
        Mis Asignaciones
      </h1>

      {/* 🏅 Reconocimiento: artículos ya revisados */}
      {translatedCount !== null && translatedCount > 0 && (
        <div className="mb-6 border-l-4 border-[#BD0E0D] bg-gray-50 dark:bg-gray-800/50 px-5 py-4">
          <p className="text-gray-800 dark:text-gray-100">
            Has traducido{" "}
            <strong className="text-[#BD0E0D]">
              {translatedCount}{" "}
              {translatedCount === 1 ? "artículo" : "artículos"}
            </strong>{" "}
            para ila. ¡Gracias por tu trabajo!
          </p>
        </div>
      )}

      {/* Tabs arriba */}
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: "articles", label: "Artículos", icon: <FaRegFileAlt /> },
          {
            key: "translated",
            label: `Traducidos${translatedCount ? ` (${translatedCount})` : ""}`,
            icon: <FaCheckCircle />,
          },
          { key: "dossiers", label: "Dossiers", icon: <FaBook /> },
        ].map((item) => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[#BD0E0D] text-[#BD0E0D]"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Contenido */}
      <div className="min-w-0">
        {activeTab === "articles" && <ArticlesList mode="translator" />}

          {activeTab === "translated" &&
            (translated.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Todavía no tenés artículos revisados.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                {translated.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="min-w-0">
                      <Link
                        href={
                          a.legacyPath
                            ? `/${locale}${a.legacyPath}`
                            : `/${locale}/articles/${a.id}`
                        }
                        target="_blank"
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#BD0E0D] hover:underline"
                      >
                        {a.titleES || a.title}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {a.edition?.number ? `ila ${a.edition.number}` : "Online"}
                        {a.reviewedAt
                          ? ` · Revisado el ${formatDate(a.reviewedAt)}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={
                        a.legacyPath
                          ? `/${locale}${a.legacyPath}`
                          : `/${locale}/articles/${a.id}`
                      }
                      target="_blank"
                      className="shrink-0 text-sm text-[#BD0E0D] hover:underline"
                    >
                      Ver →
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {activeTab === "dossiers" && (
            <GenericAdminListDossiers
              endpoint={`/api/editions?translatorId=${userId}`}
              columns={dossierColumns}
              editUrlPrefix="/dashboard/editions/translate"
              deleteUrlPrefix={null}
              itemName="dossier"
              defaultSortField="number"
              defaultSortOrder="desc"
              mode="translator"
            />
          )}
        </div>
    </div>
  );
}
