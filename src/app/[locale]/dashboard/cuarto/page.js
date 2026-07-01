"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaDoorOpen, FaPlay, FaPause, FaStop, FaSearch } from "react-icons/fa";
import {
  useArticleTTS,
  htmlToBlocks,
  voiceLabel,
} from "../../components/ArticleListen/useArticleTTS";

// El Cuarto es privado: solo este email puede entrar.
const SUPER_ADMIN_EMAIL = "e.zeangeloni@gmail.com";

// Audiencias configurables para la función "Escuchar".
const LISTEN_AUDIENCES = [
  { key: "admin", de: "Admins", es: "Admins" },
  { key: "digitalabo", de: "Digital ABO", es: "Digital ABO" },
  { key: "translator", de: "Übersetzer:innen", es: "Traductores" },
  { key: "user", de: "Alle Nutzer", es: "Usuarios (todos)" },
];

export default function CuartoPage() {
  const locale = useLocale();
  const isDE = locale === "de";
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSuperAdmin = session?.user?.email === SUPER_ADMIN_EMAIL;

  // Guard: si no es el super admin, fuera del Cuarto.
  useEffect(() => {
    if (status === "loading") return;
    if (!isSuperAdmin) router.replace("/dashboard");
  }, [status, isSuperAdmin, router]);

  // ── Feature flags ───────────────────────────────────────────────────────
  const [flags, setFlags] = useState(null);
  const [savingFlags, setSavingFlags] = useState(false);
  useEffect(() => {
    fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((d) => setFlags(d))
      .catch(() => {});
  }, []);

  const saveFlags = async (next) => {
    setFlags(next); // optimista
    setSavingFlags(true);
    try {
      const res = await fetch("/api/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) setFlags(await res.json());
    } catch {
      // si falla, recargar el estado real
      fetch("/api/feature-flags")
        .then((r) => r.json())
        .then((d) => setFlags(d))
        .catch(() => {});
    } finally {
      setSavingFlags(false);
    }
  };

  const toggleFlag = (feature, audience) => {
    if (!flags) return;
    saveFlags({
      ...flags,
      [feature]: {
        ...flags[feature],
        [audience]: !flags[feature]?.[audience],
      },
    });
  };

  // "Nadie": apaga todas las audiencias. El super-admin (desarrollador) sigue
  // viendo la función igual, porque el provider lo habilita sin mirar los flags.
  const clearAudiences = (feature) => {
    if (!flags) return;
    const cleared = LISTEN_AUDIENCES.reduce(
      (acc, a) => ({ ...acc, [a.key]: false }),
      {}
    );
    saveFlags({ ...flags, [feature]: { ...flags[feature], ...cleared } });
  };

  const listenNoneOn = LISTEN_AUDIENCES.every((a) => !flags?.listen?.[a.key]);
  const globilaNoneOn = LISTEN_AUDIENCES.every((a) => !flags?.globila?.[a.key]);

  // ── Búsqueda ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Artículo seleccionado + audio ─────────────────────────────────────
  const [article, setArticle] = useState(null);
  const [lang, setLang] = useState(locale); // "de" | "es" — idioma a escuchar
  const [blocks, setBlocks] = useState([]);

  const tts = useArticleTTS(lang);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/articles/search?query=${encodeURIComponent(query)}&locale=${locale}&limit=15`
      );
      const data = await res.json();
      setResults(data.articles || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectArticle = (a) => {
    tts.stop();
    setArticle(a);
    setLang(a.contentES && locale === "es" ? "es" : "de");
  };

  // Reconstruir los bloques del cuerpo cuando cambia el artículo o el idioma.
  useEffect(() => {
    if (!article) {
      setBlocks([]);
      return;
    }
    const html = lang === "es" ? article.contentES : article.content;
    setBlocks(htmlToBlocks(html));
  }, [article, lang]);

  // Bloques que se leen y se renderizan: título + subtítulo + cuerpo.
  // El índice de resaltado (tts.currentBlock) referencia esta lista.
  const displayBlocks = useMemo(() => {
    if (!article) return [];
    const title = lang === "es" ? article.titleES : article.title;
    const subtitle = lang === "es" ? article.subtitleES : article.subtitle;
    return [title, subtitle, ...blocks].filter(Boolean);
  }, [article, lang, blocks]);

  if (status === "loading" || !isSuperAdmin) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-none border-2 border-[#BD0E0D] text-[#BD0E0D]">
          <FaDoorOpen size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuarto</h1>
          <p className="text-sm text-gray-500">
            {isDE
              ? "Experimentierraum — Artikel zum Anhören"
              : "Cuarto de experimentos — artículos para escuchar"}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* Experimento 1: TTS */}
      <div className="mb-4">
        <span className="inline-block rounded-none bg-gray-900 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {isDE ? "Experiment 1" : "Experimento 1"} · 🔊 Text-to-Speech
        </span>
      </div>

      {/* Panel de audiencias: quién ve "Escuchar" en la página de artículo */}
      <div className="mb-6 border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="mb-3 text-sm font-semibold text-gray-700">
          {isDE
            ? "Wer sieht „Anhören“ auf der Artikelseite?"
            : "¿Quién ve „Escuchar“ en la página de artículo?"}
          {savingFlags && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {isDE ? "speichert…" : "guardando…"}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => clearAudiences("listen")}
            disabled={!flags}
            className={`rounded-none border px-3 py-1.5 text-xs font-semibold transition-colors ${
              listenNoneOn
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
            } disabled:opacity-40`}
          >
            {listenNoneOn ? "✓ " : ""}
            {isDE ? "Niemand" : "Nadie"}
          </button>
          {LISTEN_AUDIENCES.map((a) => {
            const on = !!flags?.listen?.[a.key];
            return (
              <button
                key={a.key}
                onClick={() => toggleFlag("listen", a.key)}
                disabled={!flags}
                className={`rounded-none border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on
                    ? "border-[#BD0E0D] bg-[#BD0E0D] text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                } disabled:opacity-40`}
              >
                {on ? "✓ " : ""}
                {isDE ? a.de : a.es}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel de audiencias: quién puede escuchar dentro de GLOBila */}
      <div className="mb-6 border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="mb-3 text-sm font-semibold text-gray-700">
          {isDE
            ? "Wer kann Artikel in GLOBila anhören?"
            : "¿Quién puede escuchar artículos dentro de GLOBila?"}
          {savingFlags && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {isDE ? "speichert…" : "guardando…"}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => clearAudiences("globila")}
            disabled={!flags}
            className={`rounded-none border px-3 py-1.5 text-xs font-semibold transition-colors ${
              globilaNoneOn
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
            } disabled:opacity-40`}
          >
            {globilaNoneOn ? "✓ " : ""}
            {isDE ? "Niemand" : "Nadie"}
          </button>
          {LISTEN_AUDIENCES.map((a) => {
            const on = !!flags?.globila?.[a.key];
            return (
              <button
                key={a.key}
                onClick={() => toggleFlag("globila", a.key)}
                disabled={!flags}
                className={`rounded-none border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on
                    ? "border-[#89B881] bg-[#89B881] text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                } disabled:opacity-40`}
              >
                {on ? "✓ " : ""}
                {isDE ? a.de : a.es}
              </button>
            );
          })}
        </div>
      </div>

      {!tts.supported && (
        <p className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
          {isDE
            ? "Dein Browser unterstützt keine Sprachausgabe."
            : "Tu navegador no soporta síntesis de voz."}
        </p>
      )}

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isDE ? "Artikel suchen…" : "Buscar un artículo…"}
          className="flex-1 rounded-none border border-gray-300 px-3 py-2 text-sm focus:border-[#BD0E0D] focus:outline-none"
        />
        <button
          type="submit"
          disabled={searching}
          className="flex items-center gap-2 rounded-none bg-[#BD0E0D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a50c0b] disabled:opacity-50"
        >
          <FaSearch size={14} />
          {isDE ? "Suchen" : "Buscar"}
        </button>
      </form>

      {/* Resultados */}
      {searching && (
        <p className="text-sm text-gray-500">{isDE ? "Suche…" : "Buscando…"}</p>
      )}
      {!searching && searched && results.length === 0 && (
        <p className="text-sm text-gray-500">
          {isDE ? "Keine Treffer." : "Sin resultados."}
        </p>
      )}
      {!article && results.length > 0 && (
        <ul className="divide-y divide-gray-100 border border-gray-200">
          {results.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => selectArticle(a)}
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">
                  {locale === "es" && a.titleES ? a.titleES : a.title}
                </span>
                {a.edition?.number && (
                  <span className="ml-2 text-xs text-gray-400">
                    ila {a.edition.number}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Reproductor */}
      {article && (
        <div>
          <button
            onClick={() => {
              tts.stop();
              setArticle(null);
            }}
            className="mb-4 text-sm text-gray-500 hover:text-[#BD0E0D]"
          >
            ← {isDE ? "Zurück zur Suche" : "Volver a la búsqueda"}
          </button>

          {/* Controles */}
          <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-3 border border-gray-200 bg-white px-4 py-3 shadow-sm">
            {!tts.isPlaying ? (
              <button
                onClick={() => tts.play(displayBlocks)}
                className="flex items-center gap-2 rounded-full bg-[#BD0E0D] px-5 py-2 text-sm font-semibold text-white hover:bg-[#a50c0b]"
              >
                <FaPlay size={12} />{" "}
                {tts.isPaused ? (isDE ? "Weiter" : "Seguir") : "Play"}
              </button>
            ) : (
              <button
                onClick={tts.pause}
                className="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                <FaPause size={12} /> {isDE ? "Pause" : "Pausa"}
              </button>
            )}
            <button
              onClick={tts.stop}
              disabled={!tts.isPlaying && !tts.isPaused}
              className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <FaStop size={12} /> Stop
            </button>

            {/* Idioma */}
            <div className="flex items-center gap-1 text-sm">
              {["de", "es"].map((l) => {
                const available =
                  l === "de" ? !!article.content : !!article.contentES;
                return (
                  <button
                    key={l}
                    disabled={!available}
                    onClick={() => {
                      tts.stop();
                      setLang(l);
                    }}
                    className={`rounded-none px-2 py-1 text-xs font-semibold uppercase ${
                      lang === l
                        ? "bg-[#BD0E0D] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    } disabled:opacity-30`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>

            {/* Velocidad */}
            <label className="flex items-center gap-2 text-xs text-gray-600">
              {isDE ? "Tempo" : "Velocidad"}
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={tts.rate}
                onChange={(e) => tts.setRate(parseFloat(e.target.value))}
              />
              <span className="w-8 tabular-nums">{tts.rate.toFixed(1)}×</span>
            </label>

            {/* Voz */}
            {tts.langVoices.length > 0 && (
              <select
                value={tts.voiceURI}
                onChange={(e) => tts.setVoiceURI(e.target.value)}
                className="rounded-none border border-gray-300 px-2 py-1 text-xs"
              >
                {tts.langVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {voiceLabel(v)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Texto con resaltado */}
          <article className="space-y-3 leading-relaxed text-gray-800">
            {displayBlocks.map((b, i) => (
              <p
                key={i}
                className={`transition-colors ${
                  tts.currentBlock === i ? "bg-yellow-100 rounded px-1" : ""
                }`}
              >
                {b}
              </p>
            ))}
          </article>
        </div>
      )}
    </div>
  );
}
