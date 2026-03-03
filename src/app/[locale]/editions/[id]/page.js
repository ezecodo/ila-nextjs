"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Image from "next/image";
import CartButton from "../../components/CartButton/CartButton";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export default function EditionDetails() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [edition, setEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualMatches, setManualMatches] = useState({});
  const t = useTranslations("dossiers");

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const params = useParams(); // Obtenemos todos los parámetros de la URL
  const locale = params.locale; // Extraemos el locale directamente de la ruta ([locale])
  const isES = locale === "es"; // Solo será true si la URL es /es/...
  const articleRefs = useRef({});

  const titleToShow =
    isES && edition?.isTranslatedES ? edition.titleES : edition?.title;

  const subtitleToShow =
    isES && edition?.isTranslatedES ? edition.subtitleES : edition?.subtitle;

  const summaryToShow =
    isES && edition?.isTranslatedES ? edition.summaryES : edition?.summary;

  const tableOfContentsToShow = edition?.tableOfContents;

  // Restaurar scroll position cuando volvemos de un artículo
  useEffect(() => {
    // Primero intentar desde searchParams (si viene de URL)
    const scrollToArticle = searchParams.get("scrollTo");

    // Si no hay en URL, intentar desde sessionStorage
    const savedArticle = sessionStorage.getItem("dossierScrollArticle");
    const savedPath = sessionStorage.getItem("dossierScrollPath");

    const articleToScroll =
      scrollToArticle ||
      (savedPath === window.location.pathname ? savedArticle : null);

    if (articleToScroll) {
      // Extraer el número del artículo (article-7 -> 7)
      const articleIndex = parseInt(articleToScroll.split("-")[1]);

      // Si el artículo está más allá de los primeros 6, expandir la lista primero
      if (articleIndex >= 6) {
        setIsExpanded(true);
      }

      // Esperar a que se renderice (más tiempo si expandimos)
      setTimeout(
        () => {
          if (articleRefs.current[articleToScroll]) {
            articleRefs.current[articleToScroll]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Limpiar sessionStorage después de usar
            sessionStorage.removeItem("dossierScrollArticle");
            sessionStorage.removeItem("dossierScrollPath");
          }
        },
        articleIndex >= 6 ? 300 : 100,
      );
    }
  }, [searchParams, articles]);

  useEffect(() => {
    if (!id) return;

    async function fetchEditionAndArticles() {
      try {
        const res = await fetch(`/api/editions/${id}`);
        if (!res.ok) throw new Error("Error al cargar la edición");
        const data = await res.json();
        setEdition(data);

        const articlesRes = await fetch(`/api/articles/edition/${data.number}`);
        const articlesData = await articlesRes.json();
        setArticles(articlesData);

        // 🔍 LOGS DETALLADOS
        console.log("🔍 === ARTÍCULOS CARGADOS ===");
        console.log("   Total artículos:", articlesData.length);
        articlesData.forEach((a) => {
          console.log(`   📰 ${a.title}`);
          console.log(`      isPublished: ${a.isPublished}`);
          console.log(`      publicationDate: ${a.publicationDate}`);
          console.log("   ---");
        });

        // Cargar matches manuales
        const matchesRes = await fetch(`/api/toc-match?editionId=${data.id}`);
        const matchesData = await matchesRes.json();
        const matchesMap = {};
        if (Array.isArray(matchesData)) {
          matchesData.forEach((m) => {
            matchesMap[m.tocTitle] = m.article;
          });
        }
        setManualMatches(matchesMap);
      } catch (err) {
        setError(err.message || "Error desconocido");
      }
    }

    fetchEditionAndArticles();
  }, [id, locale]);

  // Función para eliminar un match manual
  async function handleRemoveMatch(tocTitle) {
    try {
      const res = await fetch("/api/toc-match", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: edition.id,
          tocTitle: tocTitle,
        }),
      });

      if (res.ok) {
        setManualMatches((prev) => {
          const newMatches = { ...prev };
          delete newMatches[tocTitle];
          return newMatches;
        });
      }
    } catch (err) {
      console.error("Error eliminando match:", err);
    }
  }
  // Función para guardar un match manual
  async function handleManualMatch(tocTitle, articleId) {
    if (!articleId) return;

    try {
      const res = await fetch("/api/toc-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: edition.id,
          tocTitle: tocTitle,
          articleId: parseInt(articleId),
        }),
      });

      if (res.ok) {
        const match = await res.json();
        setManualMatches((prev) => ({
          ...prev,
          [tocTitle]: match.article,
        }));
      }
    } catch (err) {
      console.error("Error guardando match:", err);
    }
  }
  function parseTableOfContents() {
    // Siempre usar el TOC alemán para el matching (alemán → alemán funciona siempre)
    const tocForParsing = edition?.tableOfContents;
    if (!tocForParsing) return [];
    let normalized = tocForParsing;

    // 🔹 Limpiar espacios especiales
    normalized = normalized
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00A0/g, " ")
      .replace(/\u2003/g, " ")
      .replace(/\u2002/g, " ")
      .trim();
    // 🧹 Eliminar etiquetas HTML si las hay
    normalized = normalized
      .replace(/<\/?[^>]+(>|$)/g, "") // quita <p>, <br>, etc.
      .replace(/&nbsp;/g, " "); // reemplaza entidades HTML

    const lines = normalized.split("\n").filter((line) => line.trim());

    const parsedArticles = [];
    let currentArticle = null;
    let beilageBuffer = [];
    let insideBeilage = false;
    let currentSection = "";
    let insideRedaktionLiest = false;

    function isArticleLine(line) {
      const trimmed = line?.trim();
      if (!trimmed) return false;

      // Evitar confundir años como 1995, 2001, etc.
      if (/^(19|20)\d{2}\b/.test(trimmed)) return false;

      // ⭐ MEJORADO: Detectar números de página vs números en el texto
      const pageMatch = trimmed.match(/^(\d{1,3})(\s*)(.+)/);

      if (!pageMatch) return false;

      const number = parseInt(pageMatch[1]);
      const spaces = pageMatch[2];
      const restOfLine = pageMatch[3];

      // 🔥 NUEVO: Verificar PRIMERO si después del número viene una palabra de tiempo/cantidad
      if (
        /^(jahre|monate|tage|wochen|stunden|minuten|sekunden|prozent|prozente|mal|personen|leute|meter|kilometer|euro|dollar|grad)b/i.test(
          restOfLine,
        )
      ) {
        return false;
      }

      // 🔥 NUEVO: Si estamos dentro de "Die Redaktion liest", ser más permisivos
      if (insideRedaktionLiest) {
        return true; // 👈 Casi cualquier línea con número es artículo aquí
      }

      // Si tiene 1 o más espacios después del número → es artículo (relajado)
      if (spaces.length >= 1) return true;

      // Si el número es pequeño (1-20) y solo tiene 1 espacio → probablemente es texto
      if (number <= 20 && spaces.length === 1) {
        return false;
      }

      // Si el número es >= 21 → probablemente es número de página
      if (number >= 21) return true;

      return true;
    }

    function isFooterLine(line) {
      return /^(titel|titelbild|titelfoto|foto|fotoserie|mit\s+bildern|bild|abbildung|das titelbild|aus\s*-?sprache|dossier)\s*[:]?/i.test(
        line,
      );
    }

    function isSectionLine(line) {
      if (isArticleLine(line)) return false;

      // 👇 Excluir explícitamente “Die Redaktion liest…” como sección
      if (/^die\s+redaktion\s+(liest|hört|hoert)/i.test(line)) {
        insideRedaktionLiest = true;
        return false;
      }

      const isKnownSection =
        /^(aktuelles|schwerpunkt|dossier|berichte|weitere berichte|beilage|kultur|solidarität|rezensionen|eine welt|wirtschaft|aus-sprache|ländernachrichten|poonal|leserinnenbriefe|buchbesprechungen|redaktion hört|redaktion hoert)/i.test(
          line,
        );

      if (isKnownSection) return true;

      const trimmedLine = line.trim();
      if (trimmedLine.length > 3 && trimmedLine === trimmedLine.toUpperCase()) {
        if (/[A-ZÄÖÜ]/.test(trimmedLine)) {
          return true;
        }
      }

      return false;
    }

    // ⭐ NUEVO: Función para acumular y cerrar buffer de líneas sueltas
    function flushTopicBuffer(topicBuffer) {
      if (topicBuffer.length === 0) return;

      const isFooter = isFooterLine(topicBuffer[0]);
      parsedArticles.push({
        id: parsedArticles.length,
        pageNumber: null,
        title: topicBuffer.join("\n"),
        subtitle: null,
        author: "",
        isLinked: false,
        matchedArticle: null,
        isSection: false,
        isFooter: isFooter,
        isTopic: !isFooter,
      });
    }

    let topicBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 🔸 PRIMERO verificar si es artículo (tiene número al inicio)
      if (isArticleLine(line)) {
        // Cerrar buffer de tópicos si existe
        flushTopicBuffer(topicBuffer);
        topicBuffer = [];

        // Cerrar artículo anterior si existe
        if (currentArticle) {
          parsedArticles.push(currentArticle);
          currentArticle = null;
        }

        // Si había buffer de beilage, cerrarlo
        if (insideBeilage && beilageBuffer.length) {
          parsedArticles.push({
            id: parsedArticles.length,
            pageNumber: null,
            title: beilageBuffer.join("\n"),
            subtitle: null,
            author: "",
            isLinked: false,
            matchedArticle: null,
            isSection: false,
          });
          beilageBuffer = [];
          insideBeilage = false;
        }

        const pageNumber = line.match(/^\d+/)?.[0] || null;
        const titleWithoutPage = line.replace(/^\d+\s*/, "").trim();

        const cleanTitle = (str) =>
          (str || "")
            .normalize("NFC")
            .toLowerCase()
            .replace(/\.\.\./g, "…")
            .replace(/["""„']/g, "")
            .replace(/\(([^)]*)\)/g, "$1") // 👈 Expande: Wi(e)der → Wieder
            .replace(/\s+/g, " ")
            .replace(/[^\p{L}\p{N}\s]/gu, "")
            .trim();

        // 🧩 Eliminar paréntesis del posible título
        const titleWithoutParentheses = titleWithoutPage
          .replace(/\(.*?\)/g, "")
          .trim();

        // 👀 Posible subtítulo en la línea siguiente
        const nextRaw = lines[i + 1]?.trim() || "";
        const nextLooksLikeSubtitle =
          nextRaw &&
          !isArticleLine(nextRaw) &&
          !isSectionLine(nextRaw) &&
          !isFooterLine(nextRaw) &&
          !/^von\s/i.test(nextRaw);

        const normalizedTocTitle = cleanTitle(titleWithoutParentheses);

        // 🔍 DEBUG LOG
        console.log(
          "🔍 Buscando match para:",
          titleWithoutPage,
          "→",
          normalizedTocTitle,
        );

        // 🔸 Caso especial: "Die Redaktion liest/hoert/hört …" + siguiente línea = TÍTULO real
        let matchedArticle = null;
        let subtitleToUse = null;

        // 🔥 PRIMERO: Verificar si hay un match manual
        if (manualMatches[titleWithoutPage]) {
          matchedArticle = manualMatches[titleWithoutPage];
        }

        if (
          /^die\s+redaktion\s+(liest|hört|hoert)/i.test(titleWithoutPage) &&
          nextLooksLikeSubtitle
        ) {
          const normalizedNext = cleanTitle(nextRaw);
          // buscar artículo cuyo SUBTÍTULO empiece por "die redaktion …"
          // y cuyo TÍTULO coincida con la siguiente línea
          matchedArticle = articles.find((a) => {
            const dbTitle = cleanTitle(a.title);
            const dbSubtitle = cleanTitle(a.subtitle || "");
            return (
              dbSubtitle.startsWith("die redaktion") &&
              (dbTitle === normalizedNext ||
                dbTitle.includes(normalizedNext) ||
                normalizedNext.includes(dbTitle))
            );
          });

          if (matchedArticle) {
            subtitleToUse = nextRaw; // guardamos el "Wofür es keinen Namen gibt"
            i++; // consumimos la siguiente línea
          }
        }

        // Si no hicimos match especial, probamos match normal contra el título
        if (!matchedArticle) {
          matchedArticle = articles.find((a) => {
            const dbTitle = cleanTitle(a.title);
            return (
              dbTitle === normalizedTocTitle ||
              dbTitle.includes(normalizedTocTitle) ||
              normalizedTocTitle.includes(dbTitle)
            );
          });

          // 🔍 DEBUG LOG
          if (matchedArticle) {
            console.log("✅ Match:", matchedArticle.title);
          } else {
            console.log("❌ No match para:", normalizedTocTitle);
            console.log(
              "   Artículos disponibles:",
              articles.map((a) => ({
                id: a.id,
                title: a.title,
                normalized: cleanTitle(a.title),
              })),
            );
          }
        }

        // 🔥 Fallback: Si no hay match por título, intentar con autor + palabras clave
        if (!matchedArticle) {
          const nextLine = lines[i + 1]?.trim() || "";
          const authorLine = nextLine.toLowerCase().startsWith("von ")
            ? nextLine
            : null;

          if (authorLine) {
            const authorName = cleanTitle(authorLine.replace(/^von\s+/i, ""));
            const titleWords = normalizedTocTitle
              .split(" ")
              .filter((w) => w.length > 4);

            matchedArticle = articles.find((a) => {
              const dbAuthor = cleanTitle(a.author || "");
              const dbTitle = cleanTitle(a.title);

              // Si el autor coincide...
              const authorMatch =
                dbAuthor.includes(authorName) || authorName.includes(dbAuthor);
              if (authorMatch && titleWords.length > 0) {
                // ...y al menos una palabra clave del título coincide
                return titleWords.some((word) => dbTitle.includes(word));
              }
              return false;
            });
          }
        }

        const isExplicitlyUnpublished = matchedArticle?.isPublished === false;

        currentArticle = {
          id: parsedArticles.length,
          pageNumber,
          title: titleWithoutPage,
          subtitle: subtitleToUse || null, // si usamos la línea siguiente como título real, la mostramos aquí
          author: null,
          isLinked: Boolean(matchedArticle) && !isExplicitlyUnpublished,
          matchedArticle: matchedArticle || null,
          isSection: false,
        };
        continue;
      }

      // 🔹 DESPUÉS verificar si es sección (sin número)
      if (isSectionLine(line)) {
        // Cerrar buffer de tópicos si existe
        flushTopicBuffer(topicBuffer);
        topicBuffer = [];

        // Cerrar artículo o bloque anterior
        if (currentArticle) {
          parsedArticles.push(currentArticle);
          currentArticle = null;
        }

        // Si había buffer de beilage abierto → cerrarlo
        if (insideBeilage && beilageBuffer.length) {
          parsedArticles.push({
            id: parsedArticles.length,
            pageNumber: null,
            title: beilageBuffer.join("\n"),
            subtitle: null,
            author: "",
            isLinked: false,
            matchedArticle: null,
            isSection: false,
          });
          beilageBuffer = [];
          insideBeilage = false;
        }

        // Crear la nueva sección
        // Crear la nueva sección
        parsedArticles.push({
          id: parsedArticles.length,
          pageNumber: null,
          title: line,
          subtitle: null,
          author: null,
          isLinked: false,
          matchedArticle: null,
          isSection: true,
        });
        currentSection = line;

        // 👇 REEMPLAZA ESTAS LÍNEAS
        // Si es "Die Redaktion liest" → activar modo especial
        insideRedaktionLiest = /die redaktion\s+(liest|hört|hoert)/i.test(line);

        // Si es Beilage → activar modo especial
        insideBeilage = /beilage/i.test(line);
        continue;
      }

      // 🔹 Si estamos dentro de Beilage (modo especial)
      if (insideBeilage) {
        if (isArticleLine(line)) {
          if (beilageBuffer.length) {
            parsedArticles.push({
              id: parsedArticles.length,
              pageNumber: null,
              title: beilageBuffer.join("\n"),
              subtitle: null,
              author: "",
              isLinked: false,
              matchedArticle: null,
              isSection: false,
            });
            beilageBuffer = [];
          }
          insideBeilage = false;
          i--;
          continue;
        } else {
          beilageBuffer.push(line);
          continue;
        }
      }

      // 🔹 Si estamos dentro de un artículo existente
      if (currentArticle) {
        if (line.toLowerCase().startsWith("von ")) {
          currentArticle.author = line;
          continue;
        }

        // ⭐ Si el artículo YA tiene autor O es footer, cerrar artículo y acumular en buffer
        if (currentArticle.author || isFooterLine(line)) {
          parsedArticles.push(currentArticle);
          currentArticle = null;

          // Acumular esta línea en el buffer
          topicBuffer.push(line);
          continue;
        }

        if (!currentArticle.subtitle) {
          currentArticle.subtitle = line;
        } else {
          currentArticle.subtitle += " " + line;
        }
        continue;
      }

      // 🔹 Si no hay artículo activo → acumular en buffer de tópicos
      // 🔹 Si no hay artículo activo → evaluar si podría ser un artículo sin número
      // 🔹 Si no hay artículo activo → evaluar si podría ser un artículo sin número
      if (!currentArticle && !isSectionLine(line) && !isArticleLine(line)) {
        if (currentSection && line.length > 3) {
          const cleanTitle = (str) =>
            str
              ?.normalize("NFC")
              .toLowerCase()
              .replace(/\.\.\./g, "…")
              .replace(/["""']/g, "")
              .replace(/\(([^)]*)\)/g, "$1") // 👈 Expande: Wi(e)der → Wieder
              .replace(/\s+/g, " ")
              .replace(/[^\p{L}\p{N}\s]/gu, "")
              .trim();

          const normalizedTocTitle = cleanTitle(line);
          const nextLine = lines[i + 1]?.trim() || "";
          const normalizedNextLine = cleanTitle(nextLine);

          // 👀 Caso especial: “Die Redaktion liest…” o similares
          const isRedaktionBlock =
            /^die\s+redaktion\s+(liest|hört|hoert)/i.test(line) &&
            nextLine.length > 3;

          let matchedArticle = null;

          if (isRedaktionBlock) {
            // 🧠 Invertimos la lógica: esta línea es el subtítulo, la siguiente el título
            matchedArticle = articles.find((a) => {
              const dbTitle = cleanTitle(a.title);
              const dbSubtitle = cleanTitle(a.subtitle);
              return (
                dbSubtitle.startsWith("die redaktion") &&
                (dbTitle === normalizedNextLine ||
                  dbTitle.includes(normalizedNextLine) ||
                  normalizedNextLine.includes(dbTitle))
              );
            });

            if (matchedArticle) {
              parsedArticles.push({
                id: parsedArticles.length,
                pageNumber: null,
                title: line, // “Die Redaktion liest…”
                subtitle: nextLine, // “Wofür es keinen Namen gibt”
                author: null,
                isLinked: true,
                matchedArticle,
                isSection: false,
              });
              i++; // 👈 saltar la siguiente línea, ya la usamos
              continue;
            }
          }

          // 🔸 Si no es un bloque especial, buscar normalmente por título
          if (!matchedArticle) {
            matchedArticle = articles.find((a) => {
              const dbTitle = cleanTitle(a.title);
              const dbSubtitle = cleanTitle(a.subtitle);
              return (
                dbTitle === normalizedTocTitle ||
                dbTitle.includes(normalizedTocTitle) ||
                normalizedTocTitle.includes(dbTitle) ||
                dbSubtitle === normalizedTocTitle
              );
            });
          }

          // 🔥 Fallback: Si no hay match por título, intentar con autor + palabras clave
          if (!matchedArticle) {
            const authorLine = nextLine.toLowerCase().startsWith("von ")
              ? nextLine
              : null;

            if (authorLine) {
              const authorName = cleanTitle(authorLine.replace(/^von\s+/i, ""));
              const titleWords = normalizedTocTitle
                .split(" ")
                .filter((w) => w.length > 4);

              matchedArticle = articles.find((a) => {
                const dbAuthor = cleanTitle(a.author || "");
                const dbTitle = cleanTitle(a.title);

                const authorMatch =
                  dbAuthor.includes(authorName) ||
                  authorName.includes(dbAuthor);
                if (authorMatch && titleWords.length > 0) {
                  return titleWords.some((word) => dbTitle.includes(word));
                }
                return false;
              });
            }
          }

          if (matchedArticle) {
            const isExplicitlyUnpublished =
              matchedArticle.isPublished === false;
            parsedArticles.push({
              id: parsedArticles.length,
              pageNumber: null,
              title: line,
              subtitle: null,
              author: null,
              isLinked: !isExplicitlyUnpublished,
              matchedArticle,
              isSection: false,
            });
            continue;
          }
        }

        // Si no hay match, tratamos como línea suelta
        topicBuffer.push(line);
      }
    }

    // 🔹 Cerrar último buffer de tópicos si existe
    flushTopicBuffer(topicBuffer);

    // 🔹 Cerrar último artículo o bloque pendiente
    if (currentArticle) parsedArticles.push(currentArticle);
    if (insideBeilage && beilageBuffer.length) {
      parsedArticles.push({
        id: parsedArticles.length,
        pageNumber: null,
        title: beilageBuffer.join("\n"),
        subtitle: null,
        author: "",
        isLinked: false,
        matchedArticle: null,
        isSection: false,
      });
    }

    return parsedArticles;
  }
  // Función para manejar el click en un artículo
  function handleArticleClick(article, e) {
    e.preventDefault();
    if (article.matchedArticle?.legacyPath) {
      // Guardar la posición de scroll en sessionStorage
      sessionStorage.setItem("dossierScrollArticle", `article-${article.id}`);
      sessionStorage.setItem("dossierScrollPath", window.location.pathname);

      // Navegar al artículo con el locale correcto
      router.push(`/${locale}${article.matchedArticle.legacyPath}`);
    }
  }

  function renderTableOfContents() {
    const contents = parseTableOfContents();

    // ✅ Evitar errores si parseTableOfContents() devuelve undefined
    const safeContents = Array.isArray(contents) ? contents : [];

    // ✅ Evita error de .slice si no es array
    const displayContents = isExpanded
      ? safeContents
      : safeContents.slice(0, 6);

    return (
      <div className="space-y-2">
        {displayContents.map((article) => (
          <div
            key={article.id}
            id={`article-${article.id}`}
            ref={(el) => {
              if (!articleRefs.current) articleRefs.current = {};
              articleRefs.current[`article-${article.id}`] = el;
            }}
            className={`group p-3 rounded-lg border transition-all duration-200 ${
              article.isLinked
                ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 shadow-sm hover:shadow cursor-pointer"
                : article.isSection
                  ? "border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/20"
                  : article.isTopic
                    ? "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/15"
                    : article.isFooter
                      ? "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {article.isLinked ? (
              <a
                href={article.matchedArticle?.legacyPath ? `/${locale}${article.matchedArticle.legacyPath}` : "#"}
                onClick={(e) => handleArticleClick(article, e)}
                className="block"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-red-700 dark:group-hover:text-red-300 leading-snug mb-1">
                      {isES && article.matchedArticle?.isTranslatedES && article.matchedArticle?.titleES
                        ? article.matchedArticle.titleES
                        : article.title}
                    </h3>

                    {(isES && article.matchedArticle?.isTranslatedES
                        ? article.matchedArticle?.subtitleES || article.subtitle
                        : article.subtitle) && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed mb-1">
                        {isES && article.matchedArticle?.isTranslatedES
                          ? article.matchedArticle?.subtitleES || article.subtitle
                          : article.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      {article.author && (
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {isES ? article.author.replace(/^von\s+/i, "") : article.author}
                        </span>
                      )}
                      {article.pageNumber && (
                        <>
                          {article.author && (
                            <span className="text-gray-400">•</span>
                          )}
                          <span className="text-gray-400 dark:text-gray-600">
                            S. {article.pageNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* Botón desvincular para admin si es match manual */}
                    {isAdmin && manualMatches[article.title] && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveMatch(article.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        title="Desvincular artículo"
                      >
                        <svg
                          className="w-4 h-4 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-4 h-4 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3
                    className={`leading-snug ${
                      article.isSection
                        ? "text-base font-bold text-gray-900 dark:text-gray-100 tracking-normal mb-1"
                        : article.isTopic
                          ? "text-sm font-bold text-gray-800 dark:text-gray-100 mb-1"
                          : article.isFooter
                            ? "text-xs font-normal text-gray-500 dark:text-gray-500 italic"
                            : "text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1"
                    }`}
                  >
                    {(isES && article.matchedArticle?.isTranslatedES && article.matchedArticle?.titleES
                      ? article.matchedArticle.titleES
                      : article.title
                    ).split("\n").map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </h3>

                  {article.subtitle && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed mb-1">
                      {article.subtitle}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    {article.author && (
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {article.author}
                      </span>
                    )}
                    {article.pageNumber && (
                      <>
                        {article.author && (
                          <span className="text-gray-400">•</span>
                        )}
                        <span className="text-gray-400 dark:text-gray-600">
                          S. {article.pageNumber}
                        </span>
                      </>
                    )}
                  </div>

                  {/* 🔧 Selector para admin - vincular artículo manualmente */}
                  {isAdmin &&
                    !article.isSection &&
                    !article.isFooter &&
                    !article.isTopic && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          Vincular artículo:
                        </label>
                        <select
                          className="mt-1 w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                          defaultValue=""
                          onChange={(e) =>
                            handleManualMatch(article.title, e.target.value)
                          }
                        >
                          <option value="">-- Seleccionar --</option>
                          {articles.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ✅ Evitar error con contents.length */}
        {Array.isArray(safeContents) && safeContents.length > 6 && (
          <div className="text-center pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-4 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shadow-sm hover:shadow rounded"
            >
              {isExpanded ? (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  {t("showLess")}
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {t("showMore", { count: safeContents.length - 6 })}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!edition) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="float-left mr-6 mb-4 w-full md:w-1/3">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={400}
            height={550}
            className="rounded shadow-md w-full max-w-xs"
          />
          <div className="badgesContainer mt-2">
            {edition.regions.length > 0 ? (
              edition.regions.map((region) => (
                <span key={region.id} className="regionBadge">
                  {region.name}
                </span>
              ))
            ) : (
              <span className="regionBadge">Sin regiones asociadas</span>
            )}
          </div>
          <div className="badgesContainer mt-2">
            {edition.topics.length > 0 ? (
              edition.topics.map((topic) => (
                <span key={topic.id} className="topicBadge">
                  {topic.name}
                </span>
              ))
            ) : (
              <span className="topicBadge">{t("noTopics")}</span>
            )}
          </div>
          {edition.isAvailableToOrder && (
            <CartButton
              onClick={() => console.log("Añadido al carrito")}
              className="mt-2"
            />
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="text-3xl md:text-4xl mb-4 leading-snug">
            <span
              className="font-bold text-gray-800 dark:text-gray-200"
              style={{ fontFamily: "Futura" }}
            >
              ila {edition.number}
            </span>{" "}
            <span className="font-serif font-bold text-red-800 dark:text-red-400">
              {titleToShow}
            </span>
          </h1>
          {subtitleToShow && (
            <p className="text-lg text-gray-600 dark:text-gray-400 italic mb-4">
              {subtitleToShow}
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t("publishedOn")}{" "}
            {new Date(edition.datePublished).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex justify-end mb-6 mt-4">
          <button
            onClick={() => {
              const element = document.querySelector("#tableOfContents h2");
              if (element) {
                const offset = -80;
                const top =
                  element.getBoundingClientRect().top + window.scrollY + offset;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
            className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full 
    border border-red-300/70 dark:border-red-700/70 
    bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm
    text-red-700 dark:text-red-300 
    hover:bg-red-600 hover:text-white dark:hover:bg-red-500 
    transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-[2px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 transition-transform group-hover:-translate-y-[1px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {locale === "de"
              ? "Zum Inhaltsverzeichnis"
              : "Ir al índice de contenidos"}
          </button>
        </div>

        <div className="article-content font-serif text-lg md:text-xlleading-normal text-gray-800 dark:text-gray-200">
          {summaryToShow ? (
            /<\/?[a-z][\s\S]*>/i.test(summaryToShow) ? (
              <div dangerouslySetInnerHTML={{ __html: summaryToShow }} />
            ) : (
              summaryToShow.split("\n").map((line, i) => (
                <p key={i} className="mb-1">
                  {line}
                </p>
              ))
            )
          ) : (
            <p>{t("noSummary")}</p>
          )}
        </div>
        <div className="clear-both"></div>
      </div>
      {tableOfContentsToShow && (
        <div id="tableOfContents" className="my-8 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("tableOfContents")}
            </h2>
          </div>
          {renderTableOfContents()}
        </div>
      )}
    </div>
  );
}
