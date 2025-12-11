"use client";
import { useState } from "react";

export default function EReaderMockup() {
  const [theme, setTheme] = useState("sepia");
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [textWidth, setTextWidth] = useState(680);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(35);

  const themes = {
    light: {
      bg: "#ffffff",
      text: "#1a1a1a",
      accent: "#dc2626",
      secondary: "#6b7280",
    },
    sepia: {
      bg: "#f4ecd8",
      text: "#5c4b37",
      accent: "#a0522d",
      secondary: "#8b7355",
    },
    dark: {
      bg: "#1a1a1a",
      text: "#e5e5e5",
      accent: "#f87171",
      secondary: "#9ca3af",
    },
  };

  const currentTheme = themes[theme];

  const sampleArticle = {
    title: "Politiken des Todes",
    subtitle: "Wie Nekropolitik in Lateinamerika Realität wird",
    author: "María González",
    readTime: "12 min",
    edition: "ila 479",
    content: `
      Die Nekropolitik, ein Begriff geprägt vom kamerunischen Philosophen Achille Mbembe, beschreibt die Macht über Leben und Tod, die bestimmte Regierungen und Institutionen ausüben. In Lateinamerika manifestiert sich diese Form der Machtausübung auf besonders drastische Weise.

      In Kolumbien beispielsweise zeigt sich die Nekropolitik in den systematischen Morden an sozialen Führungspersönlichkeiten. Seit dem Friedensabkommen von 2016 wurden mehr als 1.400 Menschenrechtsverteidiger*innen ermordet. Diese Zahlen verdeutlichen, wie der Staat durch Unterlassung oder aktive Beteiligung den Tod bestimmter Bevölkerungsgruppen in Kauf nimmt.

      Brasilien unter Bolsonaro bot ein weiteres erschreckendes Beispiel. Die COVID-19-Pandemie wurde bewusst ignoriert, was zu über 700.000 Todesfällen führte. Die Entscheidung, keine wirksamen Maßnahmen zu ergreifen, war eine Form der Nekropolitik – eine Entscheidung darüber, welche Leben als schützenswert gelten.

      Die Grenze zwischen Mexiko und den USA ist ein weiterer Schauplatz der Nekropolitik. Tausende Migrant*innen sterben jährlich beim Versuch, in die USA zu gelangen. Die bewusste Militarisierung bestimmter Grenzabschnitte zwingt Menschen auf immer gefährlichere Routen.
    `,
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* Top Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: currentTheme.bg,
          borderBottom: `1px solid ${currentTheme.secondary}30`,
          transform: showControls ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: currentTheme.text }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-sm font-medium">Zurück</span>
            </button>
            <span className="text-sm" style={{ color: currentTheme.secondary }}>
              {sampleArticle.edition}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg transition-colors hover:bg-black/10"
              style={{ color: currentTheme.text }}
              title="Lesezeichen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button
              className="p-2 rounded-lg transition-colors hover:bg-black/10"
              style={{ color: currentTheme.text }}
              title="Teilen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
            <button
              className="p-2 rounded-lg transition-colors hover:bg-black/10"
              style={{ color: currentTheme.text }}
              onClick={() => setShowControls(!showControls)}
              title="Einstellungen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Reading Progress */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: `${currentTheme.secondary}20` }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: currentTheme.accent,
            }}
          />
        </div>
      </div>

      {/* Controls Panel */}
      <div
        className="fixed top-16 right-4 z-40 rounded-xl shadow-2xl p-4 transition-all duration-300"
        style={{
          backgroundColor: currentTheme.bg,
          border: `1px solid ${currentTheme.secondary}30`,
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
          transform: showControls ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        {/* Theme Selector */}
        <div className="mb-4">
          <label
            className="text-xs font-medium mb-2 block"
            style={{ color: currentTheme.secondary }}
          >
            Thema
          </label>
          <div className="flex gap-2">
            {[
              { id: "light", label: "Hell", bg: "#ffffff", border: "#e5e5e5" },
              { id: "sepia", label: "Sepia", bg: "#f4ecd8", border: "#d4c4a8" },
              { id: "dark", label: "Dunkel", bg: "#1a1a1a", border: "#333" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="w-10 h-10 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: t.bg,
                  border:
                    theme === t.id
                      ? `3px solid ${currentTheme.accent}`
                      : `2px solid ${t.border}`,
                }}
                title={t.label}
              />
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="mb-4">
          <label
            className="text-xs font-medium mb-2 block"
            style={{ color: currentTheme.secondary }}
          >
            Schriftgröße
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: `${currentTheme.secondary}20`,
                color: currentTheme.text,
              }}
            >
              A-
            </button>
            <span
              className="text-sm font-medium w-8 text-center"
              style={{ color: currentTheme.text }}
            >
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: `${currentTheme.secondary}20`,
                color: currentTheme.text,
              }}
            >
              A+
            </button>
          </div>
        </div>

        {/* Line Height */}
        <div className="mb-4">
          <label
            className="text-xs font-medium mb-2 block"
            style={{ color: currentTheme.secondary }}
          >
            Zeilenabstand
          </label>
          <input
            type="range"
            min="1.4"
            max="2.4"
            step="0.2"
            value={lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>

        {/* Text Width */}
        <div>
          <label
            className="text-xs font-medium mb-2 block"
            style={{ color: currentTheme.secondary }}
          >
            Textbreite
          </label>
          <input
            type="range"
            min="480"
            max="1400"
            step="40"
            value={textWidth}
            onChange={(e) => setTextWidth(parseInt(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      </div>

      {/* Main Content */}
      <main
        className="pt-24 pb-32 px-4 transition-all duration-300"
        onClick={() => setShowControls(!showControls)}
      >
        <article className="mx-auto" style={{ maxWidth: `${textWidth}px` }}>
          {/* Article Header */}
          <header className="mb-12 text-center">
            <h1
              className="font-serif font-bold mb-4 leading-tight"
              style={{
                color: currentTheme.accent,
                fontSize: `${fontSize * 2}px`,
              }}
            >
              {sampleArticle.title}
            </h1>
            <p
              className="text-xl mb-6"
              style={{ color: currentTheme.secondary }}
            >
              {sampleArticle.subtitle}
            </p>
            <div
              className="flex items-center justify-center gap-4 text-sm"
              style={{ color: currentTheme.secondary }}
            >
              <span>{sampleArticle.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {sampleArticle.readTime}
              </span>
            </div>
          </header>

          {/* Article Body */}
          <div
            className="font-serif"
            style={{
              color: currentTheme.text,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            {sampleArticle.content
              .trim()
              .split("\n\n")
              .map((paragraph, idx) => (
                <p key={idx} className="mb-6">
                  {idx === 0 && (
                    <span
                      className="float-left text-6xl font-bold mr-3 -mt-2"
                      style={{ color: currentTheme.accent }}
                    >
                      {paragraph.charAt(0)}
                    </span>
                  )}
                  {idx === 0 ? paragraph.slice(1).trim() : paragraph.trim()}
                </p>
              ))}
          </div>
        </article>
      </main>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: currentTheme.bg,
          borderTop: `1px solid ${currentTheme.secondary}30`,
          transform: showControls ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: `${currentTheme.secondary}15`,
              color: currentTheme.text,
            }}
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Vorheriger Artikel</span>
          </button>

          <span className="text-sm" style={{ color: currentTheme.secondary }}>
            {progress}% gelesen
          </span>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: currentTheme.accent,
              color: "#ffffff",
            }}
          >
            <span className="text-sm">Nächster Artikel</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Click hint */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm transition-opacity duration-500"
        style={{
          backgroundColor: `${currentTheme.secondary}20`,
          color: currentTheme.secondary,
          opacity: showControls ? 0 : 1,
        }}
      >
        Tippen um Steuerung anzuzeigen
      </div>
    </div>
  );
}
