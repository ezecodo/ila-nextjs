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

// Pairs: { id, question, answer, size? }          → normal Q&A  (size: "s"|"m"|"l", default "m")
//        { id, question, answer, isSubtitle: true } → section heading (T)

const SIZE_FONT = { s: "0.85em", m: null, l: "1.2em" };

export function qaToHtml(pairs) {
  return pairs
    .map(({ question, answer, isSubtitle, size }) => {
      const q = (question || "").trim();

      // Subtitle (T) → <h3>
      if (isSubtitle) {
        return q ? `<h3>${escapeHtml(q)}</h3>` : "";
      }

      const a = (answer || "").trim();
      if (!q && !a) return "";
      const fontSize = SIZE_FONT[size] ?? null;
      const styleAttr = fontSize ? ` style="font-size:${fontSize}"` : "";
      const questionHtml = q
        ? `<p${styleAttr}><strong>${escapeHtml(q)}</strong></p>`
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
    if (tag !== "P" && tag !== "H1" && tag !== "H2" && tag !== "H3" && tag !== "H4") continue;

    const strongChild = el.querySelector("strong, b");
    const wholeTextBold =
      strongChild &&
      el.textContent.trim() === strongChild.textContent.trim();

    // Also detect Google Docs bold spans: <span style="font-weight:700">
    const boldSpan = el.querySelector('span[style*="font-weight"]');
    const wholeTextBoldSpan =
      boldSpan &&
      /font-weight\s*:\s*(bold|700|800|900)/i.test(boldSpan.getAttribute("style") || "") &&
      el.textContent.trim() === boldSpan.textContent.trim();

    // H3/H4 → section subtitle (T)
    if (tag === "H3" || tag === "H4") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({
        id: genId(),
        question: unescapeHtml(el.textContent.trim()),
        answer: "",
        isSubtitle: true,
      });
      currentPair = null;
    // Bold paragraph or H1/H2 → question (F)
    } else if (wholeTextBold || wholeTextBoldSpan || tag === "H1" || tag === "H2") {
      if (currentPair) pairs.push(currentPair);
      // Detect size from inline font-size style on the <p>
      const inlineStyle = el.getAttribute("style") || "";
      const fsMatch = inlineStyle.match(/font-size\s*:\s*([\d.]+)em/);
      let size = "m";
      if (fsMatch) {
        const val = parseFloat(fsMatch[1]);
        if (val <= 0.9) size = "s";
        else if (val >= 1.1) size = "l";
      }
      currentPair = {
        id: genId(),
        question: unescapeHtml(el.textContent.trim()),
        answer: "",
        size,
      };
    } else {
      const rawHtml = el.innerHTML
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "");
      const text = unescapeHtml(rawHtml).trim();
      if (!text) continue;
      if (!currentPair) {
        currentPair = { id: genId(), question: "", answer: "" };
      }
      currentPair.answer += (currentPair.answer ? "\n\n" : "") + text;
    }
  }

  if (currentPair) pairs.push(currentPair);
  return pairs.length ? pairs : [{ id: genId(), question: "", answer: "" }];
}

// ── Parse pasted content (plain text or HTML from Google Docs) ─────────────
// Block model: { text, type: "question" | "subtitle" | "answer" }

function isQuestionBlock(text) {
  return (
    /\?\s*$/.test(text) ||
    (text.length <= 200 && /^[A-ZÄÖÜÑÁÉÍÓÚ¿]/.test(text) && /:\s*$/.test(text))
  );
}

export function parseToBlocks(plainText, html) {
  const hasFormatting = html && /<(strong|b|span[^>]+font-weight|h[1-6])\b/i.test(html);

  if (hasFormatting) {
    if (typeof window !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const elements = Array.from(doc.body.querySelectorAll("p, h1, h2, h3, h4"));
      const blocks = [];
      for (const el of elements) {
        const text = el.textContent.trim();
        if (!text) continue;
        const tag = el.tagName;

        // H3/H4 → subtitle
        if (tag === "H3" || tag === "H4") {
          blocks.push({ text, type: "subtitle" });
          continue;
        }

        const strongChild = el.querySelector("strong, b");
        const boldSpan = el.querySelector('span[style*="font-weight"]');
        const isBold =
          (strongChild && text === strongChild.textContent.trim()) ||
          (boldSpan &&
            /font-weight\s*:\s*(bold|700|800|900)/i.test(
              boldSpan.getAttribute("style") || ""
            ) &&
            text === boldSpan.textContent.trim()) ||
          tag === "H1" || tag === "H2";

        blocks.push({ text, type: isBold ? "question" : "answer" });
      }
      if (blocks.length > 0) {
        const hasBoldQuestions = blocks.some((b) => b.type === "question");
        if (hasBoldQuestions) {
          return blocks;
        }
        // Paragraphs found but no bold → apply ? heuristic
        return blocks.map((b) =>
          b.type === "subtitle"
            ? b
            : { ...b, type: isQuestionBlock(b.text) ? "question" : "answer" }
        );
      }
    }
    // HTML had formatting tags but no parseable blocks → fall through to plain text
  }

  // ── Plain text parsing ─────────────────────────────────────────────────
  const rawLines = plainText.split("\n");
  const paragraphs = [];
  let currentLines = [];

  for (const line of rawLines) {
    if (line.trim() === "") {
      if (currentLines.length > 0) {
        paragraphs.push(currentLines.join(" ").trim());
        currentLines = [];
      }
    } else {
      currentLines.push(line.trim());
    }
  }
  if (currentLines.length > 0) paragraphs.push(currentLines.join(" ").trim());

  const blocks = [];

  for (const para of paragraphs) {
    if (!para) continue;

    if (/\?\s*$/.test(para)) {
      blocks.push({ text: para, type: "question" });
      continue;
    }

    const qIdx = para.indexOf("?");
    if (qIdx !== -1) {
      const questionPart = para.slice(0, qIdx + 1).trim();
      const answerPart = para.slice(qIdx + 1).trim();
      if (questionPart.length >= 10 && questionPart.length <= 500 && answerPart.length >= 20) {
        blocks.push({ text: questionPart, type: "question" });
        blocks.push({ text: answerPart, type: "answer" });
        continue;
      }
    }

    blocks.push({ text: para, type: "answer" });
  }

  return blocks.length ? blocks : [{ text: plainText.trim(), type: "answer" }];
}

// cycle: answer → question → subtitle → answer
function nextBlockType(type) {
  if (type === "answer") return "question";
  if (type === "question") return "subtitle";
  return "answer";
}

function blocksToQa(blocks) {
  const pairs = [];
  let currentPair = null;

  for (const block of blocks) {
    if (block.type === "subtitle") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({ id: genId(), question: block.text, answer: "", isSubtitle: true });
      currentPair = null;
    } else if (block.type === "question") {
      if (currentPair) pairs.push(currentPair);
      currentPair = { id: genId(), question: block.text, answer: "", size: block.size || "m" };
    } else {
      if (!currentPair) currentPair = { id: genId(), question: "", answer: "" };
      currentPair.answer += (currentPair.answer ? "\n\n" : "") + block.text;
    }
  }

  if (currentPair) pairs.push(currentPair);
  return pairs.length ? pairs : [{ id: genId(), question: "", answer: "" }];
}

function parsePastedContent(plainText, html) {
  return blocksToQa(parseToBlocks(plainText, html));
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

// ── Block type label & styles ─────────────────────────────────────────────

const BLOCK_STYLES = {
  question: {
    badge: "F",
    badgeClass: "bg-[#BD0E0D] text-white",
    rowClass: "bg-[#BD0E0D]/10 border-[#BD0E0D]/40 hover:bg-[#BD0E0D]/15",
    textClass: "font-bold text-white",
  },
  subtitle: {
    badge: "T",
    badgeClass: "bg-amber-500 text-white",
    rowClass: "bg-amber-500/10 border-amber-400/40 hover:bg-amber-500/15",
    textClass: "font-semibold text-amber-200",
  },
  answer: {
    badge: "A",
    badgeClass: "bg-gray-700 text-gray-400",
    rowClass: "bg-gray-900 border-gray-700 hover:border-gray-500",
    textClass: "text-gray-400",
  },
};

// ── Paste import panel ────────────────────────────────────────────────────

function PasteImportPanel({ onImport, onClose, initialBlocks = null }) {
  const [pastedHtml, setPastedHtml] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [blocks, setBlocks] = useState(initialBlocks);
  const textareaRef = useRef(null);
  // refs array for block textareas — used to focus after split
  const blockRefsArr = useRef([]);
  const focusTargetRef = useRef(null); // index to focus after next render

  const analyse = (text, html) => setBlocks(parseToBlocks(text, html));

  const handlePaste = (e) => {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    setPastedHtml(html);
    setPastedText(text);
    e.preventDefault();
    if (textareaRef.current) textareaRef.current.value = text;
    analyse(text, html);
  };

  const cycleBlockType = (i) =>
    setBlocks((prev) =>
      prev.map((b, idx) =>
        idx === i ? { ...b, type: nextBlockType(b.type) } : b
      )
    );

  const updateBlockText = (i, text) => {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, text } : b)));
    const el = blockRefsArr.current[i];
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const updateBlockSize = (i, size) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, size } : b)));

  const splitBlock = (i, cursorPos) => {
    setBlocks((prev) => {
      const block = prev[i];
      const before = block.text.slice(0, cursorPos).trim();
      const after = block.text.slice(cursorPos).trim();
      const next = [...prev];
      next.splice(
        i,
        1,
        { text: before, type: block.type },
        { text: after, type: "answer" }
      );
      return next.filter((b) => b.text.length > 0 || next.indexOf(b) === i + 1);
    });
    focusTargetRef.current = i + 1;
  };

  const deleteBlock = (i) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== i);
      return next;
    });
    focusTargetRef.current = Math.max(0, i - 1);
  };

  // Focus management after split/delete
  useEffect(() => {
    if (focusTargetRef.current !== null) {
      const idx = focusTargetRef.current;
      const el = blockRefsArr.current[idx];
      if (el) {
        el.focus();
        el.setSelectionRange(0, 0);
      }
      focusTargetRef.current = null;
    }
  });

  // Auto-resize all block textareas when blocks first appear
  useEffect(() => {
    if (!blocks) return;
    blockRefsArr.current.forEach((el) => {
      if (el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    });
  }, [blocks?.length]);

  const reset = () => {
    setBlocks(null);
    setPastedHtml("");
    setPastedText("");
    if (textareaRef.current) textareaRef.current.value = "";
  };

  const usedHtml =
    pastedHtml &&
    /<(strong|b|span[^>]+font-weight|h[1-6])\b/i.test(pastedHtml) &&
    blocks?.some((b) => b.type === "question" || b.type === "subtitle");

  const questionCount = blocks?.filter((b) => b.type === "question").length ?? 0;
  const subtitleCount = blocks?.filter((b) => b.type === "subtitle").length ?? 0;
  const answerCount = blocks?.filter((b) => b.type === "answer").length ?? 0;
  const finalPairs = blocks ? blocksToQa(blocks) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-950">

      {/* Top bar */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-800"
        style={{ background: "#141414" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl" style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}>
            ila
          </span>
          <span className="text-[#BD0E0D]">·</span>
          <span className="text-gray-400 text-sm">Interview importieren</span>
        </div>

        {blocks && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {usedHtml ? "✅ Fettdruck erkannt" : "⚠️ Erkennung per «?»"}
              {" · "}
              <span className="text-[#BD0E0D] font-bold">{questionCount} F</span>
              {" · "}
              <span className="text-amber-400 font-bold">{subtitleCount} T</span>
              {" · "}
              <span className="text-gray-400">{answerCount} A</span>
            </span>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-gray-500 hover:text-white border border-gray-700 rounded px-3 py-1.5 transition-colors"
            >
              Neu einfügen
            </button>
            <button
              type="button"
              onClick={() => onImport(finalPairs, blocks)}
              className="text-sm font-bold bg-[#BD0E0D] hover:bg-[#a50c0b] text-white rounded-lg px-5 py-1.5 transition-colors"
            >
              Übernehmen ({questionCount} F · {subtitleCount} T)
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors ml-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">

        {/* Paste area — shown when no blocks yet */}
        {!blocks && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            <div className="text-center">
              <p className="text-white text-xl font-bold mb-2">Text einfügen</p>
              <p className="text-gray-400 text-sm">
                Kopiere den Interviewtext aus Google Docs, Word oder einer Webseite<br />
                und füge ihn unten ein — Fragen werden automatisch erkannt
              </p>
            </div>
            <textarea
              ref={textareaRef}
              onPaste={handlePaste}
              onChange={() => {}}
              placeholder="Strg+V / Cmd+V"
              className="w-full max-w-3xl h-72 bg-gray-900 text-gray-200 text-sm border border-gray-700 rounded-xl px-5 py-4 outline-none focus:border-[#BD0E0D] resize-none placeholder:text-gray-600 leading-relaxed"
            />
            {pastedText && (
              <button
                type="button"
                onClick={() => analyse(pastedText, pastedHtml)}
                className="px-6 py-2.5 bg-[#BD0E0D] text-white text-sm font-bold rounded-lg hover:bg-[#a50c0b] transition-colors"
              >
                Analysieren
              </button>
            )}
          </div>
        )}

        {/* Block editor — shown after detection */}
        {blocks && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2 max-w-4xl mx-auto w-full">
            <p className="text-xs text-gray-500 mb-4">
              <span className="text-gray-300 font-semibold">Badge klicken</span> = Typ wechseln (
              <span className="text-[#BD0E0D] font-bold">F</span> →{" "}
              <span className="text-amber-400 font-bold">T</span> →{" "}
              <span className="text-gray-400">A</span>){" · "}
              <span className="text-gray-300 font-semibold">Enter</span> = Block teilen
            </p>
            {blocks.map((block, i) => {
              const s = BLOCK_STYLES[block.type] || BLOCK_STYLES.answer;
              const blockSize = block.size || "m";
              const taSize =
                blockSize === "s" ? "text-xs" :
                blockSize === "l" ? "text-base" : "text-sm";
              return (
                <div
                  key={i}
                  className={`w-full rounded-xl border px-4 py-3 transition-colors flex items-start gap-3 ${s.rowClass}`}
                >
                  {/* Badge — click to cycle type */}
                  <button
                    type="button"
                    onClick={() => cycleBlockType(i)}
                    title="Typ wechseln"
                    className={`shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-opacity hover:opacity-75 ${s.badgeClass}`}
                  >
                    {s.badge}
                  </button>

                  {/* Text + size buttons */}
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      ref={(el) => { blockRefsArr.current[i] = el; }}
                      value={block.text}
                      onChange={(e) => updateBlockText(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          splitBlock(i, e.target.selectionStart);
                        }
                        if (e.key === "Backspace" && block.text === "") {
                          e.preventDefault();
                          deleteBlock(i);
                        }
                      }}
                      rows={1}
                      className={`w-full bg-transparent outline-none resize-none leading-relaxed overflow-hidden font-bold ${taSize} ${s.textClass}`}
                      style={{ minHeight: "22px" }}
                    />
                    {/* Size selector — only for F blocks */}
                    {block.type === "question" && (
                      <div className="flex items-center gap-1">
                        {["s", "m", "l"].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateBlockSize(i, sz)}
                            title={{ s: "Klein", m: "Normal", l: "Groß" }[sz]}
                            className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black transition-colors ${
                              blockSize === sz
                                ? "bg-[#BD0E0D] text-white"
                                : "text-gray-500 border border-gray-600 hover:border-gray-300 hover:text-gray-200"
                            }`}
                          >
                            {sz.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom action bar */}
            <div className="sticky bottom-0 bg-gray-950 pt-4 pb-2 flex gap-3">
              <button
                type="button"
                onClick={() => onImport(finalPairs, blocks)}
                className="flex-1 py-3 bg-[#BD0E0D] hover:bg-[#a50c0b] text-white font-bold rounded-xl transition-colors"
              >
                Übernehmen ({questionCount} F · {subtitleCount} T)
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors text-sm"
              >
                Neu einfügen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual Q&A pair card ──────────────────────────────────────────────

function QAPair({ pair, index, total, onChange, onRemove, onMove }) {
  const answerRef = useRef(null);
  useAutoResize(answerRef);

  // ── Subtitle (T) variant ──────────────────────────────────────────────
  if (pair.isSubtitle) {
    return (
      <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50 shadow-sm">
        <div className="px-4 py-2.5 flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600 shrink-0">
            T
          </span>
          <input
            type="text"
            value={pair.question}
            onChange={(e) => onChange(pair.id, "question", e.target.value)}
            placeholder="Zwischentitel eingeben…"
            className="flex-1 bg-transparent text-gray-800 font-bold text-sm outline-none placeholder:text-gray-400 placeholder:font-normal"
          />
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              className="w-6 h-6 flex items-center justify-center text-amber-400 hover:text-amber-700 disabled:opacity-30 rounded transition-colors"
              title="Nach oben"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={index === total - 1}
              className="w-6 h-6 flex items-center justify-center text-amber-400 hover:text-amber-700 disabled:opacity-30 rounded transition-colors"
              title="Nach unten"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => onRemove(pair.id)}
              className="w-6 h-6 flex items-center justify-center text-amber-400 hover:text-red-500 rounded transition-colors"
              title="Entfernen"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Q&A variant ────────────────────────────────────────────────────────
  const size = pair.size || "m";
  const questionTextSize =
    size === "s" ? "text-xs" : size === "l" ? "text-base" : "text-sm";

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
          className={`flex-1 bg-transparent text-gray-900 font-bold outline-none placeholder:text-gray-400 placeholder:font-normal ${questionTextSize}`}
        />
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
          onChange={(e) => onChange(pair.id, "answer", e.target.value)}
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
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [lastBlocks, setLastBlocks] = useState(null); // blocks from last paste import

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
    setPairs((prev) => [...prev, { id: genId(), question: "", answer: "", size: "m" }]);

  const addSubtitle = () =>
    setPairs((prev) => [...prev, { id: genId(), question: "", answer: "", isSubtitle: true }]);

  const movePair = (index, dir) => {
    const next = [...pairs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPairs(next);
  };

  const handleImportFromPaste = (importedPairs, blocks) => {
    setPairs(importedPairs);
    setLastBlocks(blocks ?? null);
    setShowPastePanel(false);
  };

  const questionCount = pairs.filter((p) => !p.isSubtitle).length;
  const subtitleCount = pairs.filter((p) => p.isSubtitle).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Interview —{" "}
          <span className="text-[#BD0E0D]">{questionCount} F</span>
          {subtitleCount > 0 && (
            <> · <span className="text-amber-500">{subtitleCount} T</span></>
          )}
        </span>
        <div className="flex items-center gap-3">
          {lastBlocks && !showPastePanel && (
            <button
              type="button"
              onClick={() => { setShowPastePanel(true); setShowPreview(false); }}
              className="text-xs text-amber-600 hover:text-amber-800 underline transition-colors"
            >
              ← Bloques bearbeiten
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowPastePanel((v) => !v); setShowPreview(false); }}
            className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            📋 Aus Dokument einfügen
          </button>
          <button
            type="button"
            onClick={() => { setShowPreview((v) => !v); setShowPastePanel(false); }}
            className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            {showPreview ? "Editor anzeigen" : "Vorschau"}
          </button>
        </div>
      </div>

      {/* Paste import panel */}
      {showPastePanel && (
        <PasteImportPanel
          onImport={handleImportFromPaste}
          onClose={() => setShowPastePanel(false)}
          initialBlocks={lastBlocks}
        />
      )}

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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addPair}
              className="flex-1 border-2 border-dashed border-gray-300 hover:border-[#BD0E0D] text-gray-400 hover:text-[#BD0E0D] rounded-lg py-3 text-sm font-medium transition-colors"
            >
              + Frage / Antwort
            </button>
            <button
              type="button"
              onClick={addSubtitle}
              className="border-2 border-dashed border-gray-300 hover:border-amber-400 text-gray-400 hover:text-amber-500 rounded-lg py-3 px-5 text-sm font-medium transition-colors"
            >
              + Titel
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400">
        Leere Zeile im Antwortfeld = neuer Absatz. Fragen werden automatisch fett dargestellt.
      </p>
    </div>
  );
}
