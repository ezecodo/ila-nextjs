"use client";

import { useState, useEffect, useRef } from "react";

// ── HTML ↔ Q&A conversion ─────────────────────────────────────────────────

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function qaToHtml(pairs) {
  return pairs
    .map(({ question, answer }) => {
      const q = (question || "").trim();
      const a = (answer || "").trim();
      if (!q && !a) return "";
      const questionHtml = q
        ? `<p><strong>${escapeHtml(q)}</strong></p>`
        : "";
      const answerHtml = a
        ? a
            .split(/\n\n+/)
            .map((para) =>
              `<p>${para.trim().split(/\n/).map(escapeHtml).join("<br>")}</p>`
            )
            .join("")
        : "";
      return questionHtml + answerHtml;
    })
    .filter(Boolean)
    .join("\n");
}

export function htmlToQa(html) {
  if (typeof window === "undefined" || !html) {
    return [{ id: genId(), question: "", answer: "" }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const elements = Array.from(doc.body.children);

  const pairs = [];
  let currentPair = null;

  for (const el of elements) {
    const tag = el.tagName;
    if (tag !== "P" && tag !== "H1" && tag !== "H2" && tag !== "H3") continue;

    const strongChild = el.querySelector("strong, b");
    const wholeTextBold =
      strongChild &&
      el.textContent.trim() === strongChild.textContent.trim();

    if (wholeTextBold) {
      if (currentPair) pairs.push(currentPair);
      currentPair = {
        id: genId(),
        question: unescapeHtml(el.textContent.trim()),
        answer: "",
      };
    } else {
      // Regular paragraph → answer
      const rawHtml = el.innerHTML
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "");
      const text = unescapeHtml(rawHtml).trim();
      if (!text) continue;
      if (!currentPair) {
        // Text before first question → preamble pair (no question)
        currentPair = { id: genId(), question: "", answer: "" };
      }
      currentPair.answer += (currentPair.answer ? "\n\n" : "") + text;
    }
  }

  if (currentPair) pairs.push(currentPair);
  return pairs.length ? pairs : [{ id: genId(), question: "", answer: "" }];
}

let _idCounter = 0;
function genId() {
  return ++_idCounter;
}

// ── Auto-resize textarea hook ─────────────────────────────────────────────

function useAutoResize(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
}

// ── Individual Q&A pair card ──────────────────────────────────────────────

function QAPair({ pair, index, total, onChange, onRemove, onMove }) {
  const answerRef = useRef(null);
  useAutoResize(answerRef);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Question */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#BD0E0D] shrink-0">
          F {index + 1}
        </span>
        <input
          type="text"
          value={pair.question}
          onChange={(e) => onChange(pair.id, "question", e.target.value)}
          placeholder="Frage eingeben…"
          className="flex-1 bg-transparent text-gray-900 font-bold text-sm outline-none placeholder:text-gray-400 placeholder:font-normal"
        />
        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors"
            title="Nach oben"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors"
            title="Nach unten"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => onRemove(pair.id)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded transition-colors"
            title="Entfernen"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Answer */}
      <div className="px-4 py-3 flex gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-1 shrink-0 w-6">
          A
        </span>
        <textarea
          ref={answerRef}
          value={pair.answer}
          onChange={(e) => {
            onChange(pair.id, "answer", e.target.value);
          }}
          placeholder={"Antwort eingeben…\n\nLeere Zeile = neuer Absatz"}
          rows={3}
          className="flex-1 bg-transparent text-gray-800 text-sm outline-none resize-none placeholder:text-gray-400 leading-relaxed"
          style={{ minHeight: "72px" }}
        />
      </div>
    </div>
  );
}

// ── Preview ───────────────────────────────────────────────────────────────

function Preview({ pairs }) {
  const html = qaToHtml(pairs);
  return (
    <div
      className="prose prose-sm max-w-none text-gray-800 text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function InterviewEditor({ value, onChange }) {
  const [pairs, setPairs] = useState(() => htmlToQa(value));
  const [showPreview, setShowPreview] = useState(false);

  // When content is loaded externally (edit page), sync once
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && value) {
      initializedRef.current = true;
      setPairs(htmlToQa(value));
    }
  }, [value]);

  // Emit HTML whenever pairs change
  useEffect(() => {
    onChange(qaToHtml(pairs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs]);

  const updatePair = (id, field, val) =>
    setPairs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );

  const removePair = (id) =>
    setPairs((prev) => prev.filter((p) => p.id !== id));

  const addPair = () =>
    setPairs((prev) => [...prev, { id: genId(), question: "", answer: "" }]);

  const movePair = (index, dir) => {
    const next = [...pairs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPairs(next);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Interview — {pairs.length} Frage{pairs.length !== 1 ? "n" : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
        >
          {showPreview ? "Editor anzeigen" : "Vorschau"}
        </button>
      </div>

      {showPreview ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[120px]">
          <Preview pairs={pairs} />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pairs.map((pair, i) => (
              <QAPair
                key={pair.id}
                pair={pair}
                index={i}
                total={pairs.length}
                onChange={updatePair}
                onRemove={removePair}
                onMove={movePair}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addPair}
            className="w-full border-2 border-dashed border-gray-300 hover:border-[#BD0E0D] text-gray-400 hover:text-[#BD0E0D] rounded-lg py-3 text-sm font-medium transition-colors"
          >
            + Frage / Antwort hinzufügen
          </button>
        </>
      )}

      <p className="text-xs text-gray-400">
        Leere Zeile im Antwortfeld = neuer Absatz. Fragen werden automatisch fett dargestellt.
      </p>
    </div>
  );
}
