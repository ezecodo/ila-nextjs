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

// Pairs:
//   { id, question, answer, size? }           → Q&A  (size: "s"|"m"|"l", default "m")
//   { id, question, answer, isSubtitle:true }  → section heading <h3>
//   { id, isImage:true, imageUrl, imageAlt, imageWidth }  → inline image <p><img></p>

// H level → font-size for question blocks (H4 = body size, no extra style)
const QUESTION_HL_FONT = { 2: "1.5rem", 3: "1.25rem", 4: null };
const IMG_SIZES = [
  { label: "S", value: "25" },
  { label: "M", value: "50" },
  { label: "L", value: "75" },
  { label: "■", value: "100" },
];

export function qaToHtml(pairs) {
  return pairs
    .map((pair) => {
      const {
        question,
        answer,
        isSubtitle,
        headingLevel,
        isImage,
        imageUrl,
        imageAlt,
        imageTitle,
        imageWidth,
        imageAlign,
        size,
        isListBlock,
        items,
        ordered,
        isPoemBlock,
        text: poemText,
      } = pair;

      // Image block
      if (isImage) {
        if (!imageUrl) return "";
        const alt = escapeHtml(imageAlt || "");
        const title = escapeHtml(imageTitle || "");
        const w = imageWidth || "100";
        const titleAttr = title ? ` title="${title}"` : "";
        // Float disponible en S/M/L; ■ (ancho completo) siempre bloque centrado.
        const floatable = w === "25" || w === "50" || w === "75";
        const align = floatable && (imageAlign === "left" || imageAlign === "right")
          ? imageAlign
          : null;
        const alignAttr = align ? ` data-align="${align}"` : "";
        return `<p><img src="${imageUrl}" alt="${alt}"${titleAttr}${alignAttr} style="width:${w}%" /></p>`;
      }

      // List block → <ul> or <ol>
      if (isListBlock) {
        const validItems = (items || []).filter(Boolean);
        if (!validItems.length) return "";
        const tag = ordered ? "ol" : "ul";
        const lis = validItems.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
        return `<${tag}>${lis}</${tag}>`;
      }

      // Poem block → <div class="poem">
      if (isPoemBlock) {
        if (!(poemText || "").trim()) return "";
        const lines = poemText.split("\n");
        const html = lines
          .map((line, idx) => {
            const t = line.trim();
            if (!t) return "<br>";
            const isLast = idx === lines.length - 1;
            return isLast ? escapeHtml(t) : escapeHtml(t) + "<br>";
          })
          .join("");
        return `<div class="poem">${html}</div>`;
      }

      const q = (question || "").trim();

      // Subtitle (T) → <hN> preserving original heading level
      if (isSubtitle) {
        const hl = headingLevel || 3;
        return q ? `<h${hl}>${escapeHtml(q)}</h${hl}>` : "";
      }

      const a = (answer || "").trim();
      if (!q && !a) return "";
      // headingLevel on question: 2=H2, 3=H3, 4=H4 (default). Backwards-compat with old size field.
      const hl = headingLevel || (size === "l" ? 2 : size === "s" ? 4 : 3);
      const fontSize = QUESTION_HL_FONT[hl] ?? null;
      const styleAttr = fontSize ? ` style="font-size:${fontSize}"` : "";
      const questionHtml = q
        ? `<p${styleAttr}><strong>${escapeHtml(q)}</strong></p>`
        : "";
      // Answer is now stored as HTML; backwards-compat with plain-text answers
      const hasBlockHtml = a && /<(p|div|ul|ol|h[1-6])\b/i.test(a);
      const stripEmptyEdges = (html) =>
        html
          .replace(/^(\s*<(p|div)>\s*(<br\s*\/?>)?\s*<\/(p|div)>\s*)+/gi, "")
          .replace(/(\s*<(p|div)>\s*(<br\s*\/?>)?\s*<\/(p|div)>\s*)+$/gi, "")
          .trim();
      const answerHtml = a
        ? hasBlockHtml
          ? stripEmptyEdges(a)
          : a
              .split(/\n\n+/)
              .map(
                (para) =>
                  `<p>${para.trim().split(/\n/).map(escapeHtml).join("<br>")}</p>`,
              )
              .join("")
        : "";
      return questionHtml + answerHtml;
    })
    .filter(Boolean)
    .join("");
}

export function htmlToQa(html) {
  if (typeof window === "undefined" || !html) {
    return [{ id: genId(), question: "", answer: "" }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Normalize <font> tags: split on <br><br> and replace with proper <p> tags
  doc.body.querySelectorAll("font").forEach((font) => {
    const fragment = doc.createDocumentFragment();
    const parts = font.innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/gi);
    parts.forEach((part) => {
      const clean = part.replace(/^(<br\s*\/?>|\s)+|(<br\s*\/?>|\s)+$/gi, "").trim();
      if (!clean) return;
      const p = doc.createElement("p");
      p.innerHTML = clean;
      fragment.appendChild(p);
    });
    font.parentNode.replaceChild(fragment, font);
  });

  // Normalize non-poem DIVs (e.g. from contentEditable/Chrome) to <p> so they get processed
  doc.body.querySelectorAll("div:not(.poem)").forEach((div) => {
    const p = doc.createElement("p");
    p.innerHTML = div.innerHTML;
    div.parentNode.replaceChild(p, div);
  });

  // If no element children exist, the content is plain text — parse with Q&A detection
  if (doc.body.children.length === 0 && doc.body.textContent.trim()) {
    // Split by single newlines, group consecutive non-question lines as one answer block
    const lines = html.split(/\n/).map((s) => s.trim());
    const pairs = [];
    let currentPairPT = null;
    let answerLines = [];

    const flushAnswer = () => {
      const text = answerLines.join("\n").trim();
      if (!text) {
        answerLines = [];
        return;
      }
      if (!currentPairPT)
        currentPairPT = { id: genId(), question: "", answer: "" };
      // Split by blank lines to create separate <p> tags
      const paras = text
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      currentPairPT.answer += paras
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
        .join("");
      answerLines = [];
    };

    for (const line of lines) {
      if (!line) {
        // Empty line — separator between paragraphs, keep in answerLines as marker
        answerLines.push("");
        continue;
      }
      const looksLikeQuestion = /\?\s*$/.test(line) && line.length <= 400;
      if (looksLikeQuestion) {
        flushAnswer();
        if (currentPairPT) pairs.push(currentPairPT);
        currentPairPT = {
          id: genId(),
          question: unescapeHtml(line),
          answer: "",
          headingLevel: 3,
        };
      } else {
        answerLines.push(line);
      }
    }
    flushAnswer();
    if (currentPairPT) pairs.push(currentPairPT);
    return pairs.length ? pairs : [{ id: genId(), question: "", answer: "" }];
  }

  const elements = Array.from(doc.body.children);

  const pairs = [];
  let currentPair = null;

  for (const el of elements) {
    const tag = el.tagName;
    const allowed = ["P", "H1", "H2", "H3", "H4", "UL", "OL", "DIV"];
    if (!allowed.includes(tag)) continue;

    // Image block: <p><img ...></p>
    if (
      tag === "P" &&
      el.children.length === 1 &&
      el.children[0].tagName === "IMG"
    ) {
      if (currentPair) pairs.push(currentPair);
      const img = el.children[0];
      const widthMatch = (img.getAttribute("style") || "").match(
        /width:\s*(\d+)%/,
      );
      pairs.push({
        id: genId(),
        isImage: true,
        imageUrl: img.getAttribute("src") || "",
        imageAlt: img.getAttribute("alt") || "",
        imageTitle: img.getAttribute("title") || "",
        imageWidth: widthMatch ? widthMatch[1] : "100",
        imageAlign: img.getAttribute("data-align") || "center",
      });
      currentPair = null;
      continue;
    }

    // List block: <ul> or <ol>
    if (tag === "UL" || tag === "OL") {
      if (currentPair) pairs.push(currentPair);
      const items = Array.from(el.querySelectorAll("li"))
        .map((li) => li.textContent.trim())
        .filter(Boolean);
      pairs.push({
        id: genId(),
        isListBlock: true,
        items,
        ordered: tag === "OL",
      });
      currentPair = null;
      continue;
    }

    // Poem block: <div class="poem">
    if (tag === "DIV" && el.classList.contains("poem")) {
      if (currentPair) pairs.push(currentPair);
      const poemText = el.innerHTML
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "");
      pairs.push({
        id: genId(),
        isPoemBlock: true,
        text: unescapeHtml(poemText),
      });
      currentPair = null;
      continue;
    }

    // Non-poem DIVs (e.g. from contentEditable/Chrome) — treat as paragraph
    if (tag === "DIV") {
      const innerHtml = el.innerHTML.trim();
      if (!innerHtml) continue;
      if (!currentPair) currentPair = { id: genId(), question: "", answer: "" };
      // If div contains block-level children, use their HTML directly to avoid nesting <p> inside <p>
      const hasBlock = /<(p|h[1-6]|ul|ol|blockquote)\b/i.test(innerHtml);
      currentPair.answer += hasBlock ? innerHtml : `<p>${innerHtml}</p>`;
      continue;
    }

    const strongChild = el.querySelector("strong, b");
    const wholeTextBold =
      strongChild &&
      el.textContent.trim() !== "" &&
      el.textContent.trim() === strongChild.textContent.trim();

    // Also detect Google Docs bold spans: <span style="font-weight:700">
    const boldSpan = el.querySelector('span[style*="font-weight"]');
    const wholeTextBoldSpan =
      boldSpan &&
      /font-weight\s*:\s*(bold|700|800|900)/i.test(
        boldSpan.getAttribute("style") || "",
      ) &&
      el.textContent.trim() === boldSpan.textContent.trim();

    // Any heading tag (H1–H4) → section subtitle (T)
    if (tag === "H1" || tag === "H2" || tag === "H3" || tag === "H4") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({
        id: genId(),
        question: unescapeHtml(el.textContent.trim()),
        answer: "",
        isSubtitle: true,
        headingLevel: parseInt(tag[1], 10),
      });
      currentPair = null;
      // Bold paragraph → question (F)
    } else if (wholeTextBold || wholeTextBoldSpan) {
      if (currentPair) pairs.push(currentPair);
      // Detect headingLevel from inline font-size style on the <p>
      const inlineStyle = el.getAttribute("style") || "";
      const fsMatch = inlineStyle.match(/font-size\s*:\s*([\d.]+)(rem|em)/);
      let headingLevel = 3; // default H3
      if (fsMatch) {
        const val = parseFloat(fsMatch[1]);
        if (val >= 1.4)
          headingLevel = 2; // H2 (1.5rem)
        else if (val >= 1.1)
          headingLevel = 3; // H3 (1.25rem)
        else headingLevel = 4; // H4 (small)
      } else {
        // No explicit size — simulate what autoFormatHeadings / autoDetectHeadings would do
        const text = el.textContent.trim();
        const endsQuestion = /\?\s*$/.test(text);
        const willBeH3 =
          text.length < 80 &&
          /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text) &&
          !/[.!?]$/.test(text);
        const willBeH4 = endsQuestion && text.length <= 140;
        if (willBeH3) headingLevel = 3;
        else if (willBeH4) headingLevel = 4;
        else headingLevel = 4; // long/body-size question
      }
      currentPair = {
        id: genId(),
        question: unescapeHtml(el.textContent.trim()),
        answer: "",
        headingLevel,
      };
    } else if (tag === "P") {
      // Detect lead-bold pattern: <p><strong>Question</strong> answer…</p>
      // → split into question (F) + answer (A) blocks
      {
        const childNodes = Array.from(el.childNodes);
        let firstIdx = 0;
        while (
          firstIdx < childNodes.length &&
          childNodes[firstIdx].nodeType === 3 &&
          !childNodes[firstIdx].textContent.trim()
        ) {
          firstIdx++;
        }
        const leadEl = childNodes[firstIdx];
        const isLeadBold =
          leadEl &&
          leadEl.nodeType === 1 &&
          /^(STRONG|B)$/.test(leadEl.tagName);
        if (isLeadBold) {
          const boldText = leadEl.textContent.trim();
          const restP = el.cloneNode(true);
          for (let k = 0; k <= firstIdx; k++) {
            if (restP.firstChild) restP.removeChild(restP.firstChild);
          }
          if (restP.firstChild && restP.firstChild.nodeType === 3) {
            restP.firstChild.textContent = restP.firstChild.textContent.replace(
              /^\s+/,
              "",
            );
          }
          const restText = restP.textContent.trim();
          if (boldText.length >= 3 && restText.length > 0) {
            if (currentPair) pairs.push(currentPair);
            const restHtml = restP.innerHTML.trim();
            pairs.push({
              id: genId(),
              question: unescapeHtml(boldText),
              answer: restHtml ? `<p>${restHtml}</p>` : "",
              headingLevel: 4,
            });
            currentPair = null;
            continue;
          }
        }
      }
      // Check if this plain paragraph looks like a heading (same heuristic as autoDetectHeadings on the article page)
      const text = el.textContent.trim();
      const isShortHeading =
        text.length > 0 &&
        text.length <= 140 &&
        /^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text) &&
        !/[.!?]$/.test(text) &&
        (text.match(/[.!?]/g) || []).length <= 1;

      if (isShortHeading) {
        if (currentPair) pairs.push(currentPair);
        pairs.push({
          id: genId(),
          question: unescapeHtml(text),
          answer: "",
          isSubtitle: true,
          headingLevel: 3,
        });
        currentPair = null;
      } else {
        // Answer paragraph — store as HTML to preserve inline formatting
        const innerHtml = el.innerHTML.trim();
        if (!innerHtml) continue;
        if (!currentPair)
          currentPair = { id: genId(), question: "", answer: "" };
        currentPair.answer += el.outerHTML;
      }
    } else {
      // Other tags — treat as answer
      const innerHtml = el.innerHTML.trim();
      if (!innerHtml) continue;
      if (!currentPair) currentPair = { id: genId(), question: "", answer: "" };
      currentPair.answer += el.outerHTML;
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

function isSubtitleBlock(text) {
  if (!text || text.length > 140) return false;
  if (!/^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text)) return false;
  // Ends with colon → clear section heading
  if (/:\s*$/.test(text)) return true;
  // No real sentence ending (abbreviations like "EE. UU." allowed)
  const endsWithSentence = /[a-z][.!?]\s*$/.test(text);
  const fewSentences = (text.match(/[a-z][.!?]/g) || []).length <= 1;
  return !endsWithSentence && fewSentences;
}

export function parseToBlocks(plainText, html) {
  const hasFormatting =
    html && /<(strong|b|span[^>]+font-weight|h[1-6])\b/i.test(html);

  if (hasFormatting) {
    if (typeof window !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const elements = Array.from(
        doc.body.querySelectorAll("p, h1, h2, h3, h4"),
      );
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
              boldSpan.getAttribute("style") || "",
            ) &&
            text === boldSpan.textContent.trim()) ||
          tag === "H1" ||
          tag === "H2";

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
            : { ...b, type: isQuestionBlock(b.text) ? "question" : "answer" },
        );
      }
    }
    // HTML had formatting tags but no parseable blocks → fall through to plain text
  }

  // ── Plain text parsing ─────────────────────────────────────────────────
  // Split into paragraphs at blank lines, but also treat subtitle-like single
  // lines as paragraph boundaries (so headings don't merge into body text).
  const rawLines = plainText.split("\n");
  const paragraphs = []; // { text, forcedSubtitle? }
  let currentLines = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (currentLines.length > 0) {
        paragraphs.push({ text: currentLines.join(" ").trim() });
        currentLines = [];
      }
    } else if (isSubtitleBlock(trimmed)) {
      // Flush any accumulated lines first
      if (currentLines.length > 0) {
        paragraphs.push({ text: currentLines.join(" ").trim() });
        currentLines = [];
      }
      paragraphs.push({ text: trimmed, forcedSubtitle: true });
    } else {
      currentLines.push(trimmed);
    }
  }
  if (currentLines.length > 0)
    paragraphs.push({ text: currentLines.join(" ").trim() });

  const blocks = [];

  for (const { text: para, forcedSubtitle } of paragraphs) {
    if (!para) continue;

    // Lines pre-classified as subtitle during grouping
    if (forcedSubtitle) {
      blocks.push({ text: para, type: "subtitle" });
      continue;
    }

    // Short paragraph ending with "?" → question
    if (/\?\s*$/.test(para) && para.length <= 300) {
      blocks.push({ text: para, type: "question" });
      continue;
    }

    // Short heading-like paragraph → subtitle (T)
    if (isSubtitleBlock(para)) {
      blocks.push({ text: para, type: "subtitle" });
      continue;
    }

    // Paragraph with "?" in the middle → split into question + answer
    const qIdx = para.indexOf("?");
    if (qIdx !== -1) {
      const questionPart = para.slice(0, qIdx + 1).trim();
      const answerPart = para.slice(qIdx + 1).trim();
      if (
        questionPart.length >= 10 &&
        questionPart.length <= 500 &&
        answerPart.length >= 20
      ) {
        blocks.push({ text: questionPart, type: "question" });
        blocks.push({ text: answerPart, type: "answer" });
        continue;
      }
    }

    blocks.push({ text: para, type: "answer" });
  }

  return blocks.length ? blocks : [{ text: plainText.trim(), type: "answer" }];
}

/// cycle: answer → question(H3) → subtitle(H2) → subtitle(H3) → subtitle(H4) → answer
function nextBlockType(type, block) {
  if (type === "answer") return "question";
  if (type === "question") return "subtitle"; // → H2
  if (type === "subtitle" && (block?.headingLevel || 3) === 2)
    return "subtitle"; // → H3
  if (type === "subtitle" && (block?.headingLevel || 3) === 3)
    return "subtitle"; // → H4
  return "answer"; // subtitle(H4) → answer
}

function blocksToQa(blocks) {
  const pairs = [];
  let currentPair = null;

  for (const block of blocks) {
    if (block.type === "image") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({
        id: genId(),
        isImage: true,
        imageUrl: block.imageUrl || "",
        imageAlt: block.imageAlt || "",
        imageTitle: block.imageTitle || "",
        imageWidth: block.imageWidth || "100",
        imageAlign: block.imageAlign || "center",
      });
      currentPair = null;
    } else if (block.type === "subtitle") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({
        id: genId(),
        question: block.text,
        answer: "",
        isSubtitle: true,
        headingLevel: block.headingLevel || 3,
      });
      currentPair = null;
    } else if (block.type === "question") {
      if (currentPair) pairs.push(currentPair);
      currentPair = {
        id: genId(),
        question: block.text,
        answer: "",
        headingLevel: block.headingLevel || 3,
      };
    } else if (block.type === "list") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({
        id: genId(),
        isListBlock: true,
        items: [...(block.items || [""])],
        ordered: block.ordered || false,
      });
      currentPair = null;
    } else if (block.type === "poem") {
      if (currentPair) pairs.push(currentPair);
      pairs.push({ id: genId(), isPoemBlock: true, text: block.text || "" });
      currentPair = null;
    } else {
      // answer — may be plain text or HTML (from contenteditable)
      if (!currentPair) currentPair = { id: genId(), question: "", answer: "" };
      const isHtml = /<[a-z]/i.test(block.text || "");
      currentPair.answer += isHtml
        ? block.text
        : `<p>${escapeHtml(block.text)}</p>`;
    }
  }

  if (currentPair) pairs.push(currentPair);
  return pairs.length ? pairs : [{ id: genId(), question: "", answer: "" }];
}

// Convert pairs → blocks (for re-opening the fullscreen panel with existing content)
function pairsToBlocks(pairs) {
  const blocks = [];
  for (const pair of pairs) {
    if (pair.isImage) {
      blocks.push({
        type: "image",
        imageUrl: pair.imageUrl || "",
        imageAlt: pair.imageAlt || "",
        imageTitle: pair.imageTitle || "",
        imageWidth: pair.imageWidth || "100",
        imageAlign: pair.imageAlign || "center",
      });
    } else if (pair.isListBlock) {
      blocks.push({
        type: "list",
        items: [...(pair.items || [""])],
        ordered: pair.ordered || false,
      });
    } else if (pair.isPoemBlock) {
      blocks.push({ type: "poem", text: pair.text || "" });
    } else if (pair.isSubtitle) {
      blocks.push({
        type: "subtitle",
        text: pair.question || "",
        headingLevel: pair.headingLevel || 3,
      });
    } else {
      if (pair.question)
        blocks.push({
          type: "question",
          text: pair.question,
          headingLevel: pair.headingLevel || 3,
        });
      if (pair.answer) blocks.push({ type: "answer", text: pair.answer }); // HTML
    }
  }
  return blocks.length ? blocks : [{ type: "answer", text: "" }];
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
    rowClass: "bg-transparent border-transparent hover:bg-[#BD0E0D]/5",
    textClass: "font-bold text-gray-900 tracking-tight",
  },
  subtitle: {
    badge: "T",
    badgeClass: "bg-amber-500 text-white",
    rowClass: "bg-transparent border-transparent hover:bg-amber-500/5",
    textClass: "font-bold text-gray-900 tracking-tight",
  },
  answer: {
    badge: "A",
    badgeClass: "bg-gray-200 text-gray-600",
    rowClass: "bg-transparent border-transparent hover:bg-gray-100/60",
    textClass: "text-gray-700",
  },
  image: {
    badge: "IMG",
    badgeClass: "bg-blue-600 text-white text-[9px]",
    rowClass: "bg-blue-50/60 border-blue-100 hover:bg-blue-50",
    textClass: "text-blue-900",
  },
  list: {
    badge: "UL",
    badgeClass: "bg-green-600 text-white text-[9px]",
    rowClass: "bg-green-50/60 border-green-100 hover:bg-green-50",
    textClass: "text-green-900",
  },
  poem: {
    badge: "P",
    badgeClass: "bg-purple-600 text-white text-[9px]",
    rowClass: "bg-purple-50/60 border-purple-100 hover:bg-purple-50",
    textClass: "text-purple-900",
  },
};

// ── Insert image line (thin divider with 📷 button) ──────────────────────

function InsertImageLine({ onInsert, uploading }) {
  return (
    <div className="group flex items-center gap-2 my-0.5 px-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <div className="flex-1 h-px bg-gray-200 group-hover:bg-gray-300 transition-colors" />
      <button
        type="button"
        onClick={onInsert}
        disabled={uploading}
        title="Bild hier einfügen"
        className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all disabled:opacity-40"
      >
        {uploading ? (
          <span className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin inline-block" />
        ) : (
          "📷"
        )}
      </button>
      <div className="flex-1 h-px bg-gray-200 group-hover:bg-gray-300 transition-colors" />
    </div>
  );
}

// ── Dark answer block (contenteditable + dark mini-toolbar) ──────────────

// Normalize Chrome's contentEditable output: replace bare <div> with <p>
function stripInlineColors(html) {
  if (!html || typeof window === "undefined") return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const MEDIA = new Set(["IMG", "FIGURE", "VIDEO", "IFRAME"]);
  tmp.querySelectorAll("*").forEach((el) => {
    if (!MEDIA.has(el.tagName)) {
      el.removeAttribute("style");
      el.removeAttribute("class");
    }
  });
  return tmp.innerHTML;
}

function normalizeAnswerHtml(html) {
  return html
    .replace(/<div>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>");
}

// Elimina <p> vacíos al inicio y final (residuo del extractContents al dividir
// bloques en Enter). Evita líneas en blanco espurias al principio del bloque nuevo.
function trimEmptyParagraphs(html) {
  if (!html) return "";
  return html
    .replace(/^(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+/i, "")
    .replace(/(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/i, "")
    .trim();
}

// Fusiona dos fragmentos de answer uniendo el ÚLTIMO <p> del primero con el
// PRIMER <p> del segundo (como hace el backspace nativo entre párrafos), en vez
// de dejar dos <p> separados. Añade un espacio en la unión si hace falta.
function mergeAnswerHtml(prevHtml, addHtml) {
  if (typeof window === "undefined") return (prevHtml || "") + (addHtml || "");
  const prev = document.createElement("div");
  prev.innerHTML = prevHtml || "";
  const add = document.createElement("div");
  add.innerHTML = addHtml || "";
  const lastPrev = prev.lastElementChild;
  const firstAdd = add.firstElementChild;
  if (
    lastPrev &&
    firstAdd &&
    lastPrev.tagName === "P" &&
    firstAdd.tagName === "P"
  ) {
    const needSpace =
      /\S$/.test(lastPrev.textContent || "") &&
      /^\S/.test(firstAdd.textContent || "");
    if (needSpace) lastPrev.appendChild(document.createTextNode(" "));
    while (firstAdd.firstChild) lastPrev.appendChild(firstAdd.firstChild);
    firstAdd.remove();
  }
  while (add.firstChild) prev.appendChild(add.firstChild);
  return prev.innerHTML;
}

// Coloca el caret en un offset de texto plano dentro de un contenteditable.
function setCaretAtTextOffset(root, offset) {
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    if (remaining <= len) {
      const r = document.createRange();
      r.setStart(node, remaining);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    remaining -= len;
  }
  const r = document.createRange();
  r.selectNodeContents(root);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
}

function DarkAnswerBlock({
  value,
  onChange,
  onDelete,
  onRef,
  onSplit,
  onMergeUp,
}) {
  const divRef = useRef(null);
  const wrapRef = useRef(null);
  const mountedRef = useRef(false);
  const savedRangeRef = useRef(null);
  const [showDossier, setShowDossier] = useState(false);
  const [editions, setEditions] = useState([]);
  const [loadingEditions, setLoadingEditions] = useState(false);
  // Caret personalizado (más grueso que el nativo). Posición relativa al wrapper.
  const [caret, setCaret] = useState(null);

  const updateCaret = () => {
    const div = divRef.current;
    const wrap = wrapRef.current;
    if (!div || !wrap || document.activeElement !== div) {
      setCaret(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
      setCaret(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!div.contains(range.startContainer)) {
      setCaret(null);
      return;
    }
    let rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const rects = range.getClientRects();
      if (rects.length) rect = rects[0];
    }
    if (!rect || (rect.height === 0 && rect.top === 0)) {
      const node =
        range.startContainer.nodeType === 1
          ? range.startContainer
          : range.startContainer.parentElement;
      if (node) rect = node.getBoundingClientRect();
    }
    if (!rect) {
      setCaret(null);
      return;
    }
    const wrapRect = wrap.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(div).lineHeight);
    setCaret({
      left: rect.left - wrapRect.left,
      top: rect.top - wrapRect.top,
      height: rect.height || (Number.isFinite(lh) ? lh : 18),
    });
  };

  useEffect(() => {
    const handler = () => updateCaret();
    document.addEventListener("selectionchange", handler);
    window.addEventListener("resize", handler);
    return () => {
      document.removeEventListener("selectionchange", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current && divRef.current) {
      mountedRef.current = true;
      const html = stripInlineColors(value || "");
      const hasBlock = /<(p|div|ul|ol)\b/i.test(html);
      divRef.current.innerHTML = html && !hasBlock ? `<p>${html}</p>` : html;
    }
  }, []);

  // Sync external value changes (e.g. merge from sibling block)
  useEffect(() => {
    if (divRef.current && document.activeElement !== divRef.current) {
      const html = stripInlineColors(value || "");
      const hasBlock = /<(p|div|ul|ol)\b/i.test(html);
      divRef.current.innerHTML = html && !hasBlock ? `<p>${html}</p>` : html;
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount > 0)
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return true;
    }
    return false;
  };

  const exec = (cmd, arg = null) => {
    // Preferir la selección viva (preservada por el mousedown+preventDefault del
    // botón). Solo restaurar un rango guardado si NO hay selección dentro del div,
    // para no pisar lo que el usuario tiene seleccionado con un rango viejo de un
    // link/dossier previo. Además styleWithCSS=false fuerza que bold/italic usen
    // <b>/<i> (toggleables) en vez de <span style> que luego no se puede quitar.
    const sel = window.getSelection();
    const liveInDiv =
      sel && sel.rangeCount > 0 && divRef.current?.contains(sel.anchorNode);
    if (!liveInDiv && !restoreSelection()) divRef.current?.focus();
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(cmd, false, arg);
    onChange(normalizeAnswerHtml(divRef.current.innerHTML));
  };

  const handleLink = (e) => {
    e.preventDefault();
    saveSelection();
    const url = prompt("URL eingeben:");
    if (!url) return;
    const full = url.startsWith("http") ? url : `https://${url}`;
    restoreSelection();
    document.execCommand("createLink", false, full);
    divRef.current.querySelectorAll("a:not(.ila-dossier)").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
    onChange(normalizeAnswerHtml(divRef.current.innerHTML));
  };

  const handleDossierClick = async (e) => {
    e.preventDefault();
    saveSelection();
    if (editions.length === 0) {
      setLoadingEditions(true);
      try {
        const res = await fetch("/api/editions");
        const data = await res.json();
        setEditions(data.sort((a, b) => b.number - a.number));
      } catch {}
      setLoadingEditions(false);
    }
    setShowDossier(true);
  };

  const handleDossierSelect = (edition) => {
    setShowDossier(false);
    restoreSelection() || divRef.current?.focus();
    const sel = window.getSelection();
    const hasSelection = sel?.rangeCount > 0 && !sel.isCollapsed;
    const href = `/editions/${edition.id}`;
    if (hasSelection) {
      document.execCommand("createLink", false, href);
      divRef.current
        .querySelectorAll(`a[href="${href}"]`)
        .forEach((a) => a.classList.add("ila-dossier"));
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${href}" class="ila-dossier">ila ${edition.number}</a>`,
      );
    }
    onChange(normalizeAnswerHtml(divRef.current.innerHTML));
  };

  const btnCls =
    "w-6 h-6 flex items-center justify-center rounded text-xs text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors";

  return (
    <div className="flex-1 flex flex-col gap-1.5 min-w-0 group/answer">
      {/* Mini toolbar — appears on hover/focus */}
      <div className="flex items-center gap-0.5 pb-1 border-b border-gray-100 opacity-0 group-focus-within/answer:opacity-100 group-hover/answer:opacity-100 transition-opacity">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className={`${btnCls} font-black`}
          title="Fett"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
          className={`${btnCls} italic`}
          title="Kursiv"
        >
          I
        </button>
        <span className="w-px h-3.5 bg-gray-200 mx-0.5" />
        <button
          type="button"
          onMouseDown={handleLink}
          className={btnCls}
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onMouseDown={handleDossierClick}
          className={btnCls}
          title="ila Dossier"
        >
          📕
        </button>
      </div>
      {/* Contenteditable */}
      <div ref={wrapRef} className="relative">
      <div
        ref={(el) => {
          divRef.current = el;
          if (onRef) onRef(el);
        }}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          onChange(normalizeAnswerHtml(divRef.current.innerHTML));
          updateCaret();
        }}
        onFocus={updateCaret}
        onKeyUp={updateCaret}
        onClick={updateCaret}
        onBlur={() => {
          setCaret(null);
          const el = divRef.current;
          setTimeout(() => {
            if (el && !el.isConnected) return; // element was removed from DOM
            if (el && !el.textContent.trim()) onDelete();
          }, 150);
        }}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand(
            "insertText",
            false,
            e.clipboardData.getData("text/plain"),
          );
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            if (!divRef.current.textContent.trim()) {
              e.preventDefault();
              onDelete();
            } else if (onMergeUp) {
              // If cursor is at the very start, merge into previous block
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                const range = sel.getRangeAt(0);
                // Cursor "al inicio del bloque": todo lo que hay entre el comienzo
                // del div y el caret es solo espacios/saltos (tolerante al espacio
                // residual que puede dejar un split y al caret invisible).
                const testRange = document.createRange();
                testRange.setStart(divRef.current, 0);
                testRange.setEnd(range.startContainer, range.startOffset);
                if (!testRange.toString().replace(/\s+/g, "")) {
                  e.preventDefault();
                  onMergeUp(normalizeAnswerHtml(divRef.current.innerHTML));
                }
              }
            }
          }
          if (e.key === "Enter" && !e.shiftKey && onSplit) {
            e.preventDefault();
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
              onSplit("");
              return;
            }
            const range = sel.getRangeAt(0);
            range.deleteContents();
            // Extract HTML from cursor to end of block
            const endRange = document.createRange();
            endRange.selectNodeContents(divRef.current);
            const afterRange = document.createRange();
            afterRange.setStart(range.startContainer, range.startOffset);
            afterRange.setEnd(endRange.endContainer, endRange.endOffset);
            const fragment = afterRange.extractContents();
            const temp = document.createElement("div");
            temp.appendChild(fragment);
            const afterHtml = trimEmptyParagraphs(
              normalizeAnswerHtml(temp.innerHTML),
            );
            const beforeHtml = trimEmptyParagraphs(
              normalizeAnswerHtml(divRef.current.innerHTML),
            );
            onSplit(beforeHtml, afterHtml);
          }
        }}
        className="text-gray-800 text-sm outline-none leading-relaxed caret-transparent [&_p]:mb-3 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline [&_a]:decoration-blue-400/60 [&_a.ila-dossier]:text-[#BD0E0D] [&_a.ila-dossier]:decoration-[#BD0E0D]/60"
        style={{ minHeight: "48px", caretColor: "transparent" }}
      />
        {caret && (
          <span
            className="ila-caret pointer-events-none absolute"
            style={{
              left: caret.left,
              top: caret.top,
              height: caret.height,
              width: 3,
              background: "#BD0E0D",
              borderRadius: 1,
            }}
          />
        )}
      </div>
      {showDossier && (
        <DossierModal
          editions={editions}
          loading={loadingEditions}
          onSelect={handleDossierSelect}
          onClose={() => setShowDossier(false)}
        />
      )}
    </div>
  );
}

// ── Paste import panel ────────────────────────────────────────────────────

function PasteImportPanel({
  onImport,
  onClose,
  initialBlocks = null,
  articleTitle,
  articleSubtitle,
  articleLegacyPath,
  articleId,
  hasSpanishContent,
  contentES,
  availableImages = [],
  onInsertAvailable,
  // Modo split: panel a la izquierda (p. ej. el PDF del módulo from-pdf) + editor
  // de bloques a la derecha, con divisor móvil. `apiRef` recibe { appendText,
  // appendHeading } para insertar la selección desde afuera (no usamos React ref
  // porque next/dynamic no lo reenvía).
  leftPanel = null,
  apiRef = null,
}) {
  const [pastedHtml, setPastedHtml] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [blocks, setBlocks] = useState(initialBlocks);
  // Ancho (%) del panel izquierdo en modo split; arrastrable con el divisor.
  const [leftPct, setLeftPct] = useState(50);
  const [showPreview, setShowPreview] = useState(false);
  const [lang, setLang] = useState("de");
  const [langSplash, setLangSplash] = useState(false);
  const [langSplashFading, setLangSplashFading] = useState(false);
  const savedDeBlocksRef = useRef(initialBlocks);

  const switchLang = (targetLang) => {
    if (targetLang === lang) return;
    // Save current blocks
    if (lang === "de") savedDeBlocksRef.current = blocks;
    // Animate
    setLangSplash(true);
    setLangSplashFading(false);
    setTimeout(() => setLangSplashFading(true), 700);
    setTimeout(() => {
      setLang(targetLang);
      if (targetLang === "es") {
        const cleanedES = contentES ? stripInlineColors(contentES) : null;
        const esBlocks = cleanedES ? pairsToBlocks(htmlToQa(cleanedES)) : null;
        setBlocks(esBlocks);
      } else {
        setBlocks(savedDeBlocksRef.current);
      }
      setLangSplash(false);
    }, 950);
  };
  const textareaRef = useRef(null);
  const blockRefsArr = useRef([]);
  const focusTargetRef = useRef(null);
  const focusEndRef = useRef(false);
  // Contenedor scrollable del editor de bloques (lado derecho en modo split) y
  // flag para hacer auto-scroll al final tras insertar texto desde el PDF.
  const scrollRef = useRef(null);
  const pendingScrollRef = useRef(false);
  // Ancla del comienzo del último texto pegado desde el PDF: { blockIdx,
  // caretOffset }. Se captura en el PRIMER append de un lote para luego dejar el
  // caret en la 1ª letra de lo pegado (la unión con el texto previo).
  const insertAnchorRef = useRef(null);
  // Offset de texto plano donde dejar el caret en un bloque contenteditable
  // (p. ej. el punto de unión tras un merge de párrafos). null = ignorar.
  const focusCaretOffsetRef = useRef(null);
  const imageInputRef = useRef(null);
  const insertAtRef = useRef(null); // index after which to insert the image
  const [uploadingImage, setUploadingImage] = useState(false);
  // Selector de imágenes recortadas (PDF). Abierto cuando hay availableImages.
  const [pickerOpen, setPickerOpen] = useState(false);

  const analyse = (text, html) => setBlocks(parseToBlocks(text, html));

  // ── API de inserción para modo split (from-pdf) ──────────────────────────
  // Inserta la selección del PDF como bloques. `appendText` añade un bloque de
  // respuesta (Fließtext); `appendHeading` un Zwischentitel.
  const appendText = (html) => {
    if (!html || !html.trim()) return;
    // Capturar el ancla solo en el primer append del lote (pre-batch state).
    if (insertAnchorRef.current === null) {
      const arr = blocks || [];
      const last = arr[arr.length - 1];
      if (last && last.type === "answer") {
        const tmp = document.createElement("div");
        tmp.innerHTML = last.text || "";
        insertAnchorRef.current = {
          blockIdx: arr.length - 1,
          caretOffset: tmp.textContent.length,
        };
      } else {
        insertAnchorRef.current = { blockIdx: arr.length, caretOffset: 0 };
      }
    }
    setBlocks((prev) => {
      const arr = prev || [];
      const last = arr[arr.length - 1];
      // Acumular el cuerpo en UN solo bloque: así Enter (nuevo párrafo) y
      // Backspace (unir párrafos) funcionan nativos dentro de un contenteditable.
      // Un Zwischentitel/pregunta corta la corrida → el siguiente texto va a un
      // bloque nuevo.
      if (last && last.type === "answer") {
        const next = [...arr];
        next[next.length - 1] = { ...last, text: (last.text || "") + html };
        return next;
      }
      return [...arr, { type: "answer", text: html }];
    });
    pendingScrollRef.current = true;
  };
  const appendHeading = (text, level = 3) => {
    if (!text || !text.trim()) return;
    if (insertAnchorRef.current === null) {
      const arr = blocks || [];
      insertAnchorRef.current = { blockIdx: arr.length, caretOffset: 0 };
    }
    setBlocks((prev) => [
      ...(prev || []),
      { type: "subtitle", text: text.trim(), headingLevel: level },
    ]);
    pendingScrollRef.current = true;
  };
  useEffect(() => {
    if (apiRef) apiRef.current = { appendText, appendHeading };
  });

  // Tras insertar texto desde el PDF, llevar el scroll del editor al final para
  // que se vea de inmediato lo recién añadido (doble rAF: esperar a que los
  // textareas se auto-redimensionen antes de medir scrollHeight).
  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    const anchor = insertAnchorRef.current;
    insertAnchorRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (anchor) {
          const el = blockRefsArr.current[anchor.blockIdx];
          if (el) {
            // Caret en la 1ª letra de lo pegado (unión con el texto previo),
            // para poder ajustar/borrar el salto de línea.
            el.focus({ preventScroll: true });
            // Posición Y de la UNIÓN. Como todo el cuerpo se acumula en un solo
            // bloque, no sirve el top del bloque: hay que medir el caret real.
            let junctionTop = null;
            if (el.contentEditable === "true") {
              setCaretAtTextOffset(el, anchor.caretOffset);
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                let rect = range.getBoundingClientRect();
                if (!rect || (rect.top === 0 && rect.height === 0)) {
                  // Caret colapsado sin rect medible → marcador temporal.
                  const marker = document.createElement("span");
                  marker.textContent = "​";
                  const r2 = range.cloneRange();
                  r2.insertNode(marker);
                  rect = marker.getBoundingClientRect();
                  marker.parentNode.removeChild(marker);
                  el.normalize();
                  setCaretAtTextOffset(el, anchor.caretOffset);
                }
                if (rect) junctionTop = rect.top;
              }
            } else if (typeof el.setSelectionRange === "function") {
              el.setSelectionRange(anchor.caretOffset, anchor.caretOffset);
            }
            // Llevar la unión cerca del borde superior visible.
            if (container) {
              const cRect = container.getBoundingClientRect();
              const refTop =
                junctionTop !== null
                  ? junctionTop
                  : el.getBoundingClientRect().top;
              const target = container.scrollTop + (refTop - cRect.top) - 80;
              container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
            } else {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
          }
        }
        if (container)
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    });
  }, [blocks]);

  // Arrastre del divisor móvil (modo split). Calcula el % en base al ancho del
  // contenedor padre del divisor.
  const dragSplit = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    const move = (ev) => {
      const x = ev.clientX - rect.left;
      const pct = Math.min(80, Math.max(20, (x / rect.width) * 100));
      setLeftPct(pct);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text/plain");
    setPastedHtml("");
    setPastedText(text);
    e.preventDefault();
    if (textareaRef.current) textareaRef.current.value = text;
    analyse(text, "");
  };

  const stripHtml = (html) => {
    if (!html || !/</.test(html)) return html || "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const cycleBlockType = (i) => {
    setBlocks((prev) =>
      prev.map((b, idx) => {
        if (idx !== i) return b;
        const nextType = nextBlockType(b.type, b);
        // When going from answer (HTML) to question/subtitle (plain text), strip tags
        const text =
          b.type === "answer" &&
          (nextType === "question" || nextType === "subtitle")
            ? stripHtml(b.text)
            : b.text;
        // Determine headingLevel for type transitions
        let headingLevel = b.headingLevel;
        if (nextType === "question" && b.type === "answer") headingLevel = 3; // A → F default H3
        if (nextType === "subtitle") {
          if (b.type === "question")
            headingLevel = 2; // F → T H2
          else if ((b.headingLevel || 3) === 2)
            headingLevel = 3; // T H2 → T H3
          else if ((b.headingLevel || 3) === 3) headingLevel = 4; // T H3 → T H4
        }
        return { ...b, type: nextType, text, headingLevel };
      }),
    );
    // Resize textarea after type change (rows=1 doesn't auto-expand otherwise)
    requestAnimationFrame(() => {
      const el = blockRefsArr.current[i];
      if (el?.tagName === "TEXTAREA") {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    });
  };

  const updateBlockText = (i, text) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, text } : b)));

  const updateBlockSize = (i, size) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, size } : b)));

  const updateBlockField = (i, field, value) =>
    setBlocks((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)),
    );

  const updateBlockListItem = (blockIdx, itemIdx, val) =>
    setBlocks((prev) =>
      prev.map((b, idx) => {
        if (idx !== blockIdx) return b;
        const items = [...b.items];
        items[itemIdx] = val;
        return { ...b, items };
      }),
    );

  const addBlockListItem = (blockIdx, afterItemIdx) =>
    setBlocks((prev) =>
      prev.map((b, idx) => {
        if (idx !== blockIdx) return b;
        const items = [...b.items];
        items.splice(afterItemIdx + 1, 0, "");
        return { ...b, items };
      }),
    );

  const removeBlockListItem = (blockIdx, itemIdx) =>
    setBlocks((prev) =>
      prev.map((b, idx) => {
        if (idx !== blockIdx || b.items.length <= 1) return b;
        return { ...b, items: b.items.filter((_, i) => i !== itemIdx) };
      }),
    );

  const splitBlock = (i, cursorPos) => {
    setBlocks((prev) => {
      const block = prev[i];
      const before = block.text.slice(0, cursorPos).trim();
      const after = block.text.slice(cursorPos).trim();
      const next = [...prev];
      next.splice(
        i,
        1,
        { text: before, type: block.type, size: block.size },
        { text: after, type: "answer" },
      );
      return next.filter(
        (b) => (b.text?.length ?? 1) > 0 || next.indexOf(b) === i + 1,
      );
    });
    focusTargetRef.current = i + 1;
  };

  const deleteBlock = (i) => {
    setBlocks((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i),
    );
    focusTargetRef.current = Math.max(0, i - 1);
  };

  // Reordena un bloque hacia arriba (-1) o abajo (+1). Útil para posicionar una
  // imagen antes del párrafo que debe envolverla (el float solo afecta al texto
  // que viene DESPUÉS de la imagen).
  const moveBlock = (i, dir) => {
    setBlocks((prev) => {
      if (!prev) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const addBlock = (type, afterIdx) => {
    const newBlock =
      type === "list"
        ? { type: "list", items: [""], ordered: false }
        : type === "poem"
          ? { type: "poem", text: "" }
          : { type, text: "" };
    setBlocks((prev) => {
      const next = [...(prev || [])];
      next.splice(afterIdx + 1, 0, newBlock);
      return next;
    });
    focusTargetRef.current = afterIdx + 1;
  };

  // "+T": si hay texto seleccionado dentro de un bloque answer (contenteditable),
  // extrae esa selección como Zwischentitel (subtitle), partiendo el bloque en
  // [answer-antes, subtitle, answer-después]. Sin selección → añade subtitle
  // vacío al final (comportamiento clásico).
  const convertSelectionToSubtitle = () => {
    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    const selText = sel ? sel.toString().trim() : "";
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !selText) {
      addBlock("subtitle", blocks.length - 1);
      return;
    }
    const anchor = sel.anchorNode;
    const idx = blockRefsArr.current.findIndex(
      (el) => el && anchor && el.contains?.(anchor),
    );
    if (idx < 0 || blocks[idx]?.type !== "answer") {
      addBlock("subtitle", blocks.length - 1);
      return;
    }
    const div = blockRefsArr.current[idx];
    const range = sel.getRangeAt(0);

    const beforeR = document.createRange();
    beforeR.selectNodeContents(div);
    beforeR.setEnd(range.startContainer, range.startOffset);
    const beforeTmp = document.createElement("div");
    beforeTmp.appendChild(beforeR.cloneContents());
    const beforeHtml = trimEmptyParagraphs(
      normalizeAnswerHtml(beforeTmp.innerHTML),
    );

    const afterR = document.createRange();
    afterR.selectNodeContents(div);
    afterR.setStart(range.endContainer, range.endOffset);
    const afterTmp = document.createElement("div");
    afterTmp.appendChild(afterR.cloneContents());
    const afterHtml = trimEmptyParagraphs(
      normalizeAnswerHtml(afterTmp.innerHTML),
    );

    // Importante: el contenteditable conserva el foco, y su efecto de sync sólo
    // reescribe el innerHTML cuando NO es el activeElement. Sin este blur, el
    // bloque original seguiría mostrando el texto completo (el seleccionado
    // quedaría duplicado debajo del nuevo título). Lo extraído ya está calculado.
    div.blur();
    setBlocks((prev) => {
      const next = [...prev];
      const repl = [];
      if (beforeHtml) repl.push({ type: "answer", text: beforeHtml });
      repl.push({ type: "subtitle", text: selText, headingLevel: 3 });
      if (afterHtml) repl.push({ type: "answer", text: afterHtml });
      next.splice(idx, 1, ...repl);
      return next;
    });
    focusTargetRef.current = idx + (beforeHtml ? 1 : 0);
  };

  const triggerImageInsert = (afterIndex) => {
    insertAtRef.current = afterIndex;
    // Si hay imágenes recortadas para ofrecer, abrir el selector; si no, ir
    // directo al file-upload de siempre.
    if (availableImages.length > 0 && onInsertAvailable) {
      setPickerOpen(true);
    } else {
      imageInputRef.current?.click();
    }
  };

  // Inserta un bloque de imagen ya con URL persistente en la posición guardada.
  const insertImageBlock = ({ url, alt = "", title = "" }) => {
    const newBlock = {
      type: "image",
      imageUrl: url,
      imageAlt: alt,
      imageTitle: title,
      imageWidth: "50",
      imageAlign: "center",
    };
    const insertAt = insertAtRef.current ?? (blocks ? blocks.length : 0);
    setBlocks((prev) => {
      const next = [...(prev || [])];
      next.splice(insertAt, 0, newBlock);
      return next;
    });
  };

  // Elegir una imagen recortada del PDF: el padre la sube/persiste y devuelve la
  // URL final; recién entonces se inserta inline.
  const handlePickAvailable = async (img) => {
    setUploadingImage(true);
    try {
      const url = await onInsertAvailable(img.id);
      if (url) insertImageBlock({ url, alt: img.alt, title: img.title });
    } catch (err) {
      console.error("Insert available image error:", err);
    } finally {
      setUploadingImage(false);
      setPickerOpen(false);
      insertAtRef.current = null;
    }
  };

  // "Neue Datei" dentro del selector → file-upload de siempre.
  const pickNewFile = () => {
    setPickerOpen(false);
    imageInputRef.current?.click();
  };

  const handlePanelImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        const newBlock = {
          type: "image",
          imageUrl: data.url,
          imageAlt: "",
          imageTitle: "",
          imageWidth: "50",
          imageAlign: "center",
        };
        const insertAt = insertAtRef.current ?? (blocks ? blocks.length : 0);
        setBlocks((prev) => {
          const next = [...(prev || [])];
          next.splice(insertAt, 0, newBlock);
          return next;
        });
      }
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploadingImage(false);
      insertAtRef.current = null;
      e.target.value = "";
    }
  };

  // Focus management after split/delete/add
  useEffect(() => {
    if (focusTargetRef.current !== null) {
      const idx = focusTargetRef.current;
      const atEnd = focusEndRef.current;
      const caretOffset = focusCaretOffsetRef.current;
      focusTargetRef.current = null;
      focusEndRef.current = false;
      focusCaretOffsetRef.current = null;
      const el = blockRefsArr.current[idx];
      if (el) {
        el.focus();
        if (caretOffset !== null && el.contentEditable === "true") {
          setCaretAtTextOffset(el, caretOffset);
        } else if (atEnd) {
          if (typeof el.setSelectionRange === "function") {
            el.setSelectionRange(el.value.length, el.value.length);
          } else if (el.contentEditable === "true") {
            const r = document.createRange();
            const s = window.getSelection();
            r.selectNodeContents(el);
            r.collapse(false);
            s.removeAllRanges();
            s.addRange(r);
          }
        } else if (typeof el.setSelectionRange === "function") {
          el.setSelectionRange(0, 0);
        }
      }
    }
  });

  // Auto-resize all textareas whenever blocks change
  useEffect(() => {
    if (!blocks) return;
    requestAnimationFrame(() => {
      blockRefsArr.current.forEach((el) => {
        if (el?.tagName === "TEXTAREA") {
          el.style.height = "auto";
          el.style.height = el.scrollHeight + "px";
        }
      });
    });
  }, [blocks]);

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
  const questionCount =
    blocks?.filter((b) => b.type === "question").length ?? 0;
  const subtitleCount =
    blocks?.filter((b) => b.type === "subtitle").length ?? 0;
  const answerCount = blocks?.filter((b) => b.type === "answer").length ?? 0;
  const finalPairs = blocks ? blocksToQa(blocks) : null;
  const hasBlocks = blocks && blocks.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-50">
      {/* Top bar */}
      <div
        className="shrink-0 relative flex items-center justify-end px-6 py-3 border-b border-gray-200 bg-white"
      >
        {/* Logo centrado */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            <span className="text-gray-500 font-semibold">publ</span>
            <span className="text-gray-900 font-black">ila</span>
            <span className="text-gray-500 font-semibold">b</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* DE/ES toggle — always visible if ES content exists */}
          {contentES && (
            <div className="flex items-center rounded overflow-hidden border border-gray-300">
              <button
                type="button"
                onClick={() => switchLang("de")}
                className={`text-xs px-2.5 py-1.5 font-bold transition-colors ${lang === "de" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => switchLang("es")}
                className={`text-xs px-2.5 py-1.5 font-bold transition-colors ${lang === "es" ? "bg-[#BD0E0D] text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                ES
              </button>
            </div>
          )}
          {hasBlocks && (
            <>
              <span className="text-xs text-gray-500 hidden sm:block">
                {usedHtml ? "✅ Fettdruck" : "⚠️ per «?»"}
                {" · "}
                <span className="text-[#BD0E0D] font-bold">
                  {questionCount} F
                </span>
                {" · "}
                <span className="text-amber-600 font-bold">
                  {subtitleCount} T
                </span>
                {" · "}
                <span className="text-gray-500">{answerCount} A</span>
              </span>
              {articleLegacyPath && (
                <a
                  href={`/${lang}${articleLegacyPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded px-3 py-1.5 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Web
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded px-3 py-1.5 transition-colors"
              >
                Vorschau
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Alles löschen und neu importieren?")) {
                    reset();
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-3 py-1.5 transition-colors"
                title="Alles löschen"
              >
                🗑 Löschen
              </button>
              <button
                type="button"
                onClick={reset}
                className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded px-3 py-1.5 transition-colors"
              >
                + Importieren
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Panel izquierdo (modo split: PDF del módulo from-pdf) + divisor móvil */}
        {leftPanel && (
          <>
            <div
              style={{ width: `${leftPct}%` }}
              className="overflow-hidden shrink-0 flex flex-col min-h-0"
            >
              {leftPanel}
            </div>
            <div
              onMouseDown={dragSplit}
              className="w-1.5 shrink-0 cursor-col-resize bg-gray-200 hover:bg-[#BD0E0D] active:bg-[#BD0E0D] transition-colors"
              title="Ziehen zum Verschieben"
            />
          </>
        )}
        {/* Lado derecho: editor de bloques (envuelto para convivir con el split) */}
        <div className="flex-1 overflow-hidden flex min-w-0 min-h-0">
        {/* Paste area — only when no blocks at all (no en modo split) */}
        {!hasBlocks && !leftPanel && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            <div className="text-center">
              <p className="text-gray-900 text-xl font-bold mb-2">
                Text importieren
              </p>
              <p className="text-gray-500 text-sm">
                Kopiere den Text aus Google Docs, Word oder einer Webseite
                <br />
                und füge ihn unten ein — Fragen werden automatisch erkannt
              </p>
            </div>
            <textarea
              ref={textareaRef}
              onPaste={handlePaste}
              onChange={() => {}}
              placeholder="Strg+V / Cmd+V"
              className="w-full max-w-3xl h-72 bg-white text-gray-800 text-sm border border-gray-200 rounded-xl px-5 py-4 outline-none focus:border-[#BD0E0D] resize-none placeholder:text-gray-400 leading-relaxed shadow-sm"
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

        {/* Hidden image input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePanelImageUpload}
        />

        {/* Selector de imágenes recortadas del PDF */}
        {pickerOpen && (
          <div
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => !uploadingImage && setPickerOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">
                  Bild einfügen
                </h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  disabled={uploadingImage}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Aus dem PDF ausgeschnittene Bilder — anklicken zum Einfügen.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handlePickAvailable(img)}
                    disabled={uploadingImage}
                    className="group relative border border-gray-200 hover:border-[#BD0E0D] rounded overflow-hidden aspect-square bg-gray-50 disabled:opacity-40"
                    title={img.title || "Bild einfügen"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || ""}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={pickNewFile}
                  disabled={uploadingImage}
                  className="text-xs font-bold text-gray-500 hover:text-blue-600 px-3 py-1.5 border border-gray-300 hover:border-blue-300 rounded disabled:opacity-40"
                >
                  📁 Neue Datei hochladen
                </button>
                {uploadingImage && (
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin inline-block" />
                    wird eingefügt…
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Block editor */}
        {(hasBlocks || leftPanel) && (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-4xl mx-auto w-full"
          >
            <p className="text-xs text-gray-400 mb-4">
              <span className="text-gray-600 font-semibold">Badge</span> = Typ
              wechseln (<span className="text-[#BD0E0D] font-bold">H3</span> →{" "}
              <span className="text-amber-600 font-bold">H2</span> →{" "}
              <span className="text-amber-600 font-bold">H3</span> →{" "}
              <span className="text-amber-600 font-bold">H4</span> →{" "}
              <span className="text-gray-600">A</span>) · F-Blöcke: H2/H3/H4
              wählen{" · "}
              <span className="text-gray-600 font-semibold">Enter</span> = neuer
              Block {" · "}
              <span className="text-gray-600 font-semibold">
                Shift+Enter
              </span>{" "}
              in A = Zeilenumbruch
            </p>

            <InsertImageLine
              onInsert={() => triggerImageInsert(0)}
              uploading={uploadingImage}
            />

            {(blocks || []).map((block, i) => {
              const s = BLOCK_STYLES[block.type] || BLOCK_STYLES.answer;
              const blockHl =
                block.headingLevel || (block.type === "question" ? 3 : 3);
              const taSize =
                block.type === "subtitle" || block.type === "question"
                  ? blockHl === 2
                    ? "text-2xl"
                    : blockHl === 3
                      ? "text-xl"
                      : "text-lg"
                  : "text-sm";

              return (
                <div key={`${lang}-${i}`} className="mb-0.5">
                  {/* ── IMAGE block ── */}
                  {block.type === "image" && (
                    <div
                      className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 ${s.rowClass}`}
                    >
                      <span
                        className={`shrink-0 w-8 h-7 flex items-center justify-center rounded font-black text-[9px] ${s.badgeClass}`}
                      >
                        IMG
                      </span>
                      {block.imageUrl && (
                        <img
                          src={block.imageUrl}
                          alt={block.imageAlt}
                          className="h-12 w-16 object-cover rounded border border-blue-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <input
                          type="text"
                          value={block.imageAlt || ""}
                          onChange={(e) =>
                            updateBlockField(i, "imageAlt", e.target.value)
                          }
                          placeholder="Alt-Text…"
                          className="w-full bg-transparent text-blue-900 text-xs outline-none placeholder:text-blue-300 border-b border-blue-200 focus:border-blue-500 pb-0.5"
                        />
                        <input
                          type="text"
                          value={block.imageTitle || ""}
                          onChange={(e) =>
                            updateBlockField(i, "imageTitle", e.target.value)
                          }
                          placeholder="Title (Tooltip)…"
                          className="w-full bg-transparent text-blue-700 text-xs outline-none placeholder:text-blue-300 pb-0.5"
                        />
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {IMG_SIZES.map(({ label, value }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              updateBlockField(i, "imageWidth", value)
                            }
                            className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${(block.imageWidth || "100") === value ? "bg-blue-600 text-white" : "border border-blue-200 text-blue-600 hover:border-blue-400"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {/* Alineación con texto envolvente — S/M/L (desktop) */}
                      {(block.imageWidth === "25" ||
                        block.imageWidth === "50" ||
                        block.imageWidth === "75") && (
                        <div className="flex gap-0.5 shrink-0 border-l border-blue-200 pl-1.5">
                          {[
                            { label: "⬅", value: "left", title: "Links — Text umfließt rechts" },
                            { label: "⬛", value: "center", title: "Zentriert (Block)" },
                            { label: "➡", value: "right", title: "Rechts — Text umfließt links" },
                          ].map(({ label, value, title }) => (
                            <button
                              key={value}
                              type="button"
                              title={title}
                              onClick={() =>
                                updateBlockField(i, "imageAlign", value)
                              }
                              className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${(block.imageAlign || "center") === value ? "bg-blue-600 text-white" : "border border-blue-200 text-blue-600 hover:border-blue-400"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Reordenar: subir la imagen antes del párrafo que debe envolverla */}
                      <div className="flex gap-0.5 shrink-0 border-l border-blue-200 pl-1.5">
                        <button
                          type="button"
                          title="Nach oben"
                          disabled={i === 0}
                          onClick={() => moveBlock(i, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[11px] font-bold border border-blue-200 text-blue-600 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          title="Nach unten"
                          disabled={i === (blocks?.length ?? 1) - 1}
                          onClick={() => moveBlock(i, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[11px] font-bold border border-blue-200 text-blue-600 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteBlock(i)}
                        className="w-6 h-6 flex items-center justify-center text-blue-400 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* ── LIST block ── */}
                  {block.type === "list" && (
                    <div
                      className={`w-full rounded-xl border px-4 py-3 ${s.rowClass}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`shrink-0 w-8 h-7 flex items-center justify-center rounded font-black text-[9px] ${s.badgeClass}`}
                        >
                          {block.ordered ? "OL" : "UL"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateBlockField(i, "ordered", !block.ordered)
                          }
                          className="text-xs text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100 transition-colors"
                        >
                          {block.ordered ? "• • •" : "1. 2."}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(i)}
                          className="ml-auto w-6 h-6 flex items-center justify-center text-green-400 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-1">
                        {(block.items || [""]).map((item, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="text-green-600 text-xs w-4 shrink-0">
                              {block.ordered ? `${j + 1}.` : "•"}
                            </span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) =>
                                updateBlockListItem(i, j, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addBlockListItem(i, j);
                                }
                                if (
                                  e.key === "Backspace" &&
                                  item === "" &&
                                  (block.items?.length ?? 1) > 1
                                ) {
                                  e.preventDefault();
                                  removeBlockListItem(i, j);
                                }
                              }}
                              placeholder={`Punkt ${j + 1}…`}
                              className="flex-1 bg-transparent text-green-900 text-sm outline-none placeholder:text-green-300"
                            />
                            {(block.items?.length ?? 1) > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBlockListItem(i, j)}
                                className="w-5 h-5 text-green-400 hover:text-red-500 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            addBlockListItem(i, (block.items?.length ?? 1) - 1)
                          }
                          className="text-xs text-green-600 hover:text-green-800 mt-1 transition-colors"
                        >
                          + Punkt
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── POEM block ── */}
                  {block.type === "poem" && (
                    <div
                      className={`w-full rounded-xl border px-4 py-3 ${s.rowClass}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`shrink-0 w-8 h-7 flex items-center justify-center rounded font-black text-[9px] ${s.badgeClass}`}
                        >
                          P
                        </span>
                        <span className="text-xs text-purple-600 flex-1">
                          Leerzeile = neue Strophe
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteBlock(i)}
                          className="w-6 h-6 flex items-center justify-center text-purple-400 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        ref={(el) => {
                          blockRefsArr.current[i] = el;
                        }}
                        value={block.text || ""}
                        onChange={(e) => updateBlockText(i, e.target.value)}
                        rows={3}
                        placeholder={
                          "Verse eingeben…\n\nLeerzeile = neue Strophe"
                        }
                        className="w-full bg-transparent text-purple-900 text-sm outline-none resize-none leading-relaxed placeholder:text-purple-300 caret-[#BD0E0D]"
                        style={{
                          minHeight: "60px",
                          caretColor: "#BD0E0D",
                          fontFamily: "Georgia, serif",
                        }}
                      />
                    </div>
                  )}

                  {/* ── ANSWER block (contenteditable + toolbar) ── */}
                  {block.type === "answer" && (
                    <div
                      className={`w-full rounded-xl border px-4 py-3 transition-colors flex items-start gap-3 ${s.rowClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => cycleBlockType(i)}
                        title="Typ wechseln"
                        className={`shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-opacity hover:opacity-75 ${s.badgeClass}`}
                      >
                        {s.badge}
                      </button>
                      <DarkAnswerBlock
                        value={block.text}
                        onChange={(html) => updateBlockText(i, html)}
                        onDelete={() => deleteBlock(i)}
                        onRef={(el) => {
                          blockRefsArr.current[i] = el;
                        }}
                        onSplit={(beforeHtml, afterHtml) => {
                          // Enter parte el bloque en el caret: el resto del texto
                          // baja a un bloque nuevo (así aparece el InsertImageLine
                          // entre ambos para insertar una imagen). Shift+Enter =
                          // salto suave dentro del bloque; Backspace al inicio los
                          // vuelve a unir (onMergeUp).
                          setBlocks((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], text: beforeHtml };
                            next.splice(i + 1, 0, {
                              type: "answer",
                              text: afterHtml,
                            });
                            return next;
                          });
                          focusTargetRef.current = i + 1;
                        }}
                        onMergeUp={
                          i === 0
                            ? null
                            : (html) => {
                                setBlocks((prev) => {
                                  if (i === 0) return prev;
                                  const prevBlock = prev[i - 1];
                                  // Solo permitir merge si el bloque anterior es
                                  // también "answer" (contentEditable). Si es un
                                  // heading/question/list/etc., concatenar HTML a
                                  // su texto plano rompe el contenido.
                                  if (prevBlock.type !== "answer") return prev;
                                  const next = [...prev];
                                  next[i - 1] = {
                                    ...prevBlock,
                                    text: mergeAnswerHtml(
                                      prevBlock.text || "",
                                      html,
                                    ),
                                  };
                                  next.splice(i, 1);
                                  return next;
                                });
                                // Caret en el punto de unión (fin del texto que
                                // ya tenía el bloque anterior), AFTER re-render.
                                const tmp = document.createElement("div");
                                tmp.innerHTML = blocks[i - 1]?.text || "";
                                focusTargetRef.current = i - 1;
                                focusCaretOffsetRef.current = (
                                  tmp.textContent || ""
                                ).length;
                              }
                        }
                      />
                    </div>
                  )}

                  {/* ── QUESTION / SUBTITLE blocks (textarea) ── */}
                  {(block.type === "question" || block.type === "subtitle") && (
                    <div
                      className={`w-full rounded-xl border px-4 py-3 transition-colors flex items-start gap-3 ${s.rowClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => cycleBlockType(i)}
                        title="Typ wechseln"
                        className={`shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-xs font-black transition-opacity hover:opacity-75 ${s.badgeClass}`}
                      >
                        {`H${block.headingLevel || (block.type === "question" ? 3 : 3)}`}
                      </button>
                      <div className="flex-1 flex flex-col gap-2">
                        <textarea
                          ref={(el) => {
                            blockRefsArr.current[i] = el;
                          }}
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
                            } else if (
                              e.key === "Backspace" &&
                              block.type === "subtitle" &&
                              e.target.selectionStart === 0 &&
                              e.target.selectionEnd === 0 &&
                              i > 0 &&
                              blocks[i - 1]?.type === "answer"
                            ) {
                              // Caret al inicio de un Zwischentitel → revertir:
                              // sumar su texto al bloque de respuesta anterior.
                              e.preventDefault();
                              const subtitleText = block.text;
                              setBlocks((prev) => {
                                const next = [...prev];
                                const prevBlock = next[i - 1];
                                next[i - 1] = {
                                  ...prevBlock,
                                  text: mergeAnswerHtml(
                                    prevBlock.text || "",
                                    `<p>${escapeHtml(subtitleText)}</p>`,
                                  ),
                                };
                                next.splice(i, 1);
                                return next;
                              });
                              const tmp = document.createElement("div");
                              tmp.innerHTML = blocks[i - 1]?.text || "";
                              focusTargetRef.current = i - 1;
                              focusCaretOffsetRef.current = (
                                tmp.textContent || ""
                              ).length;
                            }
                          }}
                          rows={1}
                          className={`w-full bg-transparent outline-none resize-none leading-relaxed overflow-hidden font-bold caret-[#BD0E0D] ${taSize} ${s.textClass}`}
                          style={{ minHeight: "22px", caretColor: "#BD0E0D" }}
                        />
                        <div className="flex items-center gap-1">
                          {[2, 3, 4].map((hl) => {
                            const isActive = blockHl === hl;
                            const activeClass =
                              block.type === "subtitle"
                                ? "bg-amber-500 text-white"
                                : "bg-[#BD0E0D] text-white";
                            return (
                              <button
                                key={hl}
                                type="button"
                                onClick={() =>
                                  setBlocks((prev) =>
                                    prev.map((b, idx) =>
                                      idx === i
                                        ? { ...b, headingLevel: hl }
                                        : b,
                                    ),
                                  )
                                }
                                title={`H${hl}`}
                                className={`w-7 h-5 flex items-center justify-center rounded text-[9px] font-black transition-colors ${isActive ? activeClass : "text-gray-500 border border-gray-300 hover:border-gray-500 hover:text-gray-800"}`}
                              >
                                H{hl}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <InsertImageLine
                    onInsert={() => triggerImageInsert(i + 1)}
                    uploading={uploadingImage}
                  />
                </div>
              );
            })}

            {/* Bottom bar: add buttons + save */}
            <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur-sm border-t border-gray-200 pt-3 pb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addBlock("question", blocks.length - 1)}
                className="border border-dashed border-[#BD0E0D]/30 hover:border-[#BD0E0D] text-[#BD0E0D]/70 hover:text-[#BD0E0D] rounded-lg py-2 px-4 text-xs font-bold transition-colors"
              >
                + F
              </button>
              <button
                type="button"
                onClick={() => addBlock("answer", blocks.length - 1)}
                className="border border-dashed border-gray-300 hover:border-gray-500 text-gray-500 hover:text-gray-800 rounded-lg py-2 px-4 text-xs font-bold transition-colors"
              >
                + A
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  // Conservar la selección del contenteditable: el foco del botón
                  // la colapsaría. Solo preventDefault si hay algo seleccionado.
                  const sel = window.getSelection();
                  if (
                    sel &&
                    sel.rangeCount > 0 &&
                    !sel.isCollapsed &&
                    sel.toString().trim()
                  ) {
                    e.preventDefault();
                  }
                }}
                onClick={() => convertSelectionToSubtitle()}
                className="border border-dashed border-amber-300 hover:border-amber-500 text-amber-600 hover:text-amber-700 rounded-lg py-2 px-4 text-xs font-bold transition-colors"
                title="Markierten Text als Zwischentitel — oder leeren Zwischentitel anhängen"
              >
                + T
              </button>
              <button
                type="button"
                onClick={() => addBlock("list", blocks.length - 1)}
                className="border border-dashed border-green-300 hover:border-green-500 text-green-600 hover:text-green-700 rounded-lg py-2 px-4 text-xs font-bold transition-colors"
              >
                ☰ Liste
              </button>
              <button
                type="button"
                onClick={() => addBlock("poem", blocks.length - 1)}
                className="border border-dashed border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 rounded-lg py-2 px-4 text-xs font-bold transition-colors"
              >
                📜 Poem
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => onImport(finalPairs, blocks, lang)}
                className={`py-2 px-6 text-white font-bold rounded-xl transition-colors text-sm shadow-sm ${lang === "es" ? "bg-blue-600 hover:bg-blue-700" : "bg-[#BD0E0D] hover:bg-[#a50c0b]"}`}
              >
                {lang === "es" ? "💾 Guardar ES" : "Speichern"}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Article preview modal ── */}
      {showPreview &&
        finalPairs &&
        (() => {
          // Same transforms as the article page (copied, not imported — never touch the article page)
          const transformHtml = (html) => {
            if (!html) return "";
            // Strip inline font/color styles so Vorschau matches the actual article page
            if (typeof window !== "undefined") {
              const tmp = document.createElement("div");
              tmp.innerHTML = html;
              const MEDIA = new Set(["IMG", "FIGURE", "VIDEO", "IFRAME"]);
              tmp.querySelectorAll("*").forEach((el) => {
                if (!MEDIA.has(el.tagName)) {
                  el.removeAttribute("style");
                  el.removeAttribute("class");
                }
              });
              html = tmp.innerHTML;
            }
            // 1. autoFormatHeadings: <p><strong>Title</strong></p> → <h3>
            html = html.replace(
              /<p>\s*<strong>([^<>{}]{3,80})<\/strong>\s*<\/p>/gi,
              (m, inner) => {
                const ok =
                  inner.length > 0 &&
                  inner.length < 120 &&
                  /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(inner) &&
                  !/[.!?]$/.test(inner);
                return ok ? `<h3>${inner}</h3>` : m;
              },
            );
            // 2. autoDetectHeadings: short plain <p> → <h3> or <h4>
            const hasH4 = /<h4\b/i.test(html);
            html = html.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
              const text = inner
                .replace(/<br\s*\/?>/gi, " ")
                .replace(/\s+/g, " ")
                .trim();
              const isShort = text.length > 0 && text.length <= 140;
              const startsUpper = /^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text);
              const endsHeading =
                /[?!:]\s*$/.test(text) || !/[.!?]$/.test(text);
              const isQuestion = /\?\s*$/.test(text);
              const fewSentences = (text.match(/[.!?]/g) || []).length <= 1;
              if (!hasH4 && isQuestion && isShort) return `<h4>${text}</h4>`;
              if (isShort && startsUpper && endsHeading && fewSentences)
                return `<h3>${text}</h3>`;
              return m;
            });
            // 3. wrapInlineImagesWithCaption
            html = html.replace(/<img([^>]+)>/gi, (match, attrs) => {
              const caption = attrs.match(/alt="([^"]*)"/)?.[1]?.trim() || "";
              const credit = attrs.match(/title="([^"]*)"/)?.[1]?.trim() || "";
              const align = attrs.match(/data-align="([^"]*)"/)?.[1]?.trim() || "";
              const floatClass =
                align === "left"
                  ? " inline-image-left"
                  : align === "right"
                    ? " inline-image-right"
                    : "";
              if (!caption && !credit && !floatClass) return match;
              const w = attrs.match(/width:\s*(\d+)%/)?.[1];
              const figStyle = floatClass && w ? ` style="width:${w}%"` : "";
              const figcap =
                caption || credit
                  ? `<figcaption>${
                      caption && credit
                        ? `${caption}<span class="image-credit"> · ${credit}</span>`
                        : caption || credit
                    }</figcaption>`
                  : "";
              return `<figure class="inline-image-figure${floatClass}"${figStyle}>${match}${figcap}</figure>`;
            });
            return html;
          };
          return (
            <div className="fixed inset-0 z-[10000] flex flex-col bg-white">
              <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
                <span className="text-sm font-semibold text-gray-500">
                  Vorschau — Artikelinhalt
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 transition-colors"
                >
                  ✕ Schließen
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <main className="max-w-4xl mx-auto px-4 py-6 md:px-6">
                  {/* Title + subtitle — same structure as article page */}
                  {(articleTitle || articleSubtitle) && (
                    <div className="max-w-3xl mx-auto mb-6">
                      {articleTitle && (
                        <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight text-gray-900 mb-4 break-words">
                          {articleTitle}
                        </h1>
                      )}
                      {articleSubtitle && (
                        <h2 className="text-lg md:text-xl font-light italic text-gray-600 mb-8">
                          {articleSubtitle}
                        </h2>
                      )}
                    </div>
                  )}
                  {/* Body content — directly inside max-w-4xl, same as article page */}
                  <div
                    className="article-content text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: transformHtml(qaToHtml(finalPairs)),
                    }}
                  />
                </main>
              </div>
            </div>
          );
        })()}

      {/* Lang switch splash */}
      {langSplash && (
        <div
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-300 ${langSplashFading ? "opacity-0" : "opacity-100"}`}
          style={{ background: "#0d0d0d" }}
        >
          <span className="text-5xl tracking-tight select-none" style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}>
            <span className="text-gray-400 font-semibold">publ</span>
            <span className="text-white font-black">ila</span>
            <span className="text-gray-400 font-semibold">b</span>
          </span>
          <span className="mt-3 text-xs font-bold tracking-widest uppercase" style={{ color: lang === "de" ? "#9ca3af" : "#3b82f6" }}>
            {lang === "de" ? "→ Español" : "→ Deutsch"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Dossier modal ─────────────────────────────────────────────────────────

function DossierModal({ editions, loading, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col"
        style={{ maxHeight: "60vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-900 mb-4 text-sm">
          📕 ila Dossier verlinken
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-0.5">
            {editions.map((edition) => (
              <button
                key={edition.id}
                type="button"
                onClick={() => onSelect(edition)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span className="font-bold text-[#BD0E0D]">
                  ila {edition.number}
                </span>
                <span className="text-gray-600 ml-2 text-xs">
                  {edition.title}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 self-end"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ── Rich answer field (contenteditable + mini toolbar) ────────────────────

function RichAnswerField({ value, onChange }) {
  const divRef = useRef(null);
  const mountedRef = useRef(false);
  const savedRangeRef = useRef(null);
  const [showDossier, setShowDossier] = useState(false);
  const [editions, setEditions] = useState([]);
  const [loadingEditions, setLoadingEditions] = useState(false);

  // Set initial HTML once on mount
  useEffect(() => {
    if (!mountedRef.current && divRef.current) {
      mountedRef.current = true;
      const html = value || "";
      // Wrap plain text in <p> so Enter creates new paragraphs
      const hasBlock = /<(p|div|ul|ol|h[1-6])\b/i.test(html);
      divRef.current.innerHTML = html && !hasBlock ? `<p>${html}</p>` : html;
    }
  }, []);

  // Sync when value is updated externally (e.g. undo/redo from parent)
  useEffect(() => {
    if (divRef.current && document.activeElement !== divRef.current) {
      const html = value || "";
      const hasBlock = /<(p|div|ul|ol|h[1-6])\b/i.test(html);
      divRef.current.innerHTML = html && !hasBlock ? `<p>${html}</p>` : html;
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return true;
    }
    return false;
  };

  const exec = (cmd, arg = null) => {
    // Ver comentario en el exec del bloque de respuesta: priorizar selección viva
    // y forzar styleWithCSS=false para que bold/italic sean toggleables.
    const sel = window.getSelection();
    const liveInDiv =
      sel && sel.rangeCount > 0 && divRef.current?.contains(sel.anchorNode);
    if (!liveInDiv && !restoreSelection()) divRef.current?.focus();
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(cmd, false, arg);
    if (onChange) onChange(divRef.current.innerHTML);
  };

  const handleLink = (e) => {
    e.preventDefault();
    saveSelection();
    const url = prompt("URL eingeben:");
    if (!url) return;
    const full = url.startsWith("http") ? url : `https://${url}`;
    restoreSelection();
    document.execCommand("createLink", false, full);
    // External links: open in new tab
    divRef.current.querySelectorAll("a:not(.ila-dossier)").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
    if (onChange) onChange(divRef.current.innerHTML);
  };

  const handleDossierClick = async (e) => {
    e.preventDefault();
    saveSelection();
    if (editions.length === 0) {
      setLoadingEditions(true);
      try {
        const res = await fetch("/api/editions");
        const data = await res.json();
        setEditions(data.sort((a, b) => b.number - a.number));
      } catch {}
      setLoadingEditions(false);
    }
    setShowDossier(true);
  };

  const handleDossierSelect = (edition) => {
    setShowDossier(false);
    restoreSelection() || divRef.current?.focus();
    const sel = window.getSelection();
    const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;
    const href = `/editions/${edition.id}`;
    if (hasSelection) {
      document.execCommand("createLink", false, href);
      divRef.current
        .querySelectorAll(`a[href="${href}"]`)
        .forEach((a) => a.classList.add("ila-dossier"));
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${href}" class="ila-dossier">ila ${edition.number}</a>`,
      );
    }
    if (onChange) onChange(divRef.current.innerHTML);
  };

  const btnBase =
    "w-6 h-6 flex items-center justify-center rounded text-xs text-gray-400 hover:bg-gray-100 transition-colors";

  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      {/* Mini toolbar */}
      <div className="flex items-center gap-0.5 pb-1 border-b border-gray-100">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className={`${btnBase} font-black hover:text-gray-800`}
          title="Fett (Strg+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
          className={`${btnBase} italic font-semibold hover:text-gray-800`}
          title="Kursiv (Strg+I)"
        >
          I
        </button>
        <span className="w-px h-4 bg-gray-200 mx-0.5" />
        <button
          type="button"
          onMouseDown={handleLink}
          className={`${btnBase} hover:text-blue-600`}
          title="Link einfügen"
        >
          🔗
        </button>
        <button
          type="button"
          onMouseDown={handleDossierClick}
          className={`${btnBase} hover:text-[#BD0E0D]`}
          title="ila Dossier verlinken"
        >
          📕
        </button>
      </div>

      {/* Contenteditable answer area */}
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange && onChange(divRef.current.innerHTML)}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        className="text-gray-800 text-sm outline-none leading-relaxed prose prose-sm max-w-none caret-[#BD0E0D]"
        style={{ minHeight: "72px", caretColor: "#BD0E0D" }}
      />

      {showDossier && (
        <DossierModal
          editions={editions}
          loading={loadingEditions}
          onSelect={handleDossierSelect}
          onClose={() => setShowDossier(false)}
        />
      )}
    </div>
  );
}

// ── List block card ───────────────────────────────────────────────────────

function QAListBlock({ pair, index, total, onChange, onRemove, onMove }) {
  const itemRefs = useRef([]);
  const focusNext = useRef(null);

  useEffect(() => {
    if (focusNext.current !== null) {
      itemRefs.current[focusNext.current]?.focus();
      focusNext.current = null;
    }
  });

  const updateItem = (idx, val) => {
    const next = [...pair.items];
    next[idx] = val;
    onChange(pair.id, "items", next);
  };

  const addItem = (afterIdx) => {
    const next = [...pair.items];
    next.splice(afterIdx + 1, 0, "");
    onChange(pair.id, "items", next);
    focusNext.current = afterIdx + 1;
  };

  const removeItem = (idx) => {
    if (pair.items.length <= 1) return;
    onChange(
      pair.id,
      "items",
      pair.items.filter((_, i) => i !== idx),
    );
    focusNext.current = Math.max(0, idx - 1);
  };

  return (
    <div className="border border-green-200 rounded-lg overflow-hidden bg-green-50 shadow-sm">
      <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-green-700 shrink-0">
          {pair.ordered ? "OL" : "UL"}
        </span>
        <button
          type="button"
          onClick={() => onChange(pair.id, "ordered", !pair.ordered)}
          className="text-xs text-green-600 border border-green-300 rounded px-2 py-0.5 hover:bg-green-100 transition-colors"
          title="Typ wechseln"
        >
          {pair.ordered ? "1. 2. 3. →" : "• • • →"}{" "}
          {pair.ordered ? "• • •" : "1. 2. 3."}
        </button>
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center text-green-400 hover:text-green-700 disabled:opacity-30 rounded transition-colors"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center text-green-400 hover:text-green-700 disabled:opacity-30 rounded transition-colors"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => onRemove(pair.id)}
            className="w-6 h-6 flex items-center justify-center text-green-400 hover:text-red-500 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1">
        {pair.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-5 shrink-0 text-right">
              {pair.ordered ? `${idx + 1}.` : "•"}
            </span>
            <input
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              type="text"
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(idx);
                }
                if (
                  e.key === "Backspace" &&
                  item === "" &&
                  pair.items.length > 1
                ) {
                  e.preventDefault();
                  removeItem(idx);
                }
              }}
              placeholder={`Punkt ${idx + 1}…`}
              className="flex-1 bg-transparent text-gray-800 text-sm outline-none placeholder:text-gray-400"
            />
            {pair.items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 text-xs transition-colors shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addItem(pair.items.length - 1)}
          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 mt-1 transition-colors"
        >
          + Punkt hinzufügen
        </button>
      </div>
    </div>
  );
}

// ── Poem block card ───────────────────────────────────────────────────────

function QAPoemBlock({ pair, index, total, onChange, onRemove, onMove }) {
  const textRef = useRef(null);
  useAutoResize(textRef);

  return (
    <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50 shadow-sm">
      <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-purple-700 shrink-0">
          POEM
        </span>
        <span className="text-xs text-purple-400 flex-1">
          Leerzeile = Strophenende
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center text-purple-400 hover:text-purple-700 disabled:opacity-30 rounded transition-colors"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center text-purple-400 hover:text-purple-700 disabled:opacity-30 rounded transition-colors"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => onRemove(pair.id)}
            className="w-6 h-6 flex items-center justify-center text-purple-400 hover:text-red-500 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        <textarea
          ref={textRef}
          value={pair.text || ""}
          onChange={(e) => onChange(pair.id, "text", e.target.value)}
          placeholder={"Verse eingeben…\n\nLeerzeile = neue Strophe"}
          rows={4}
          className="w-full bg-transparent text-gray-800 text-sm outline-none resize-none leading-relaxed placeholder:text-gray-400"
          style={{
            minHeight: "80px",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        />
      </div>
    </div>
  );
}

// ── Image block card ──────────────────────────────────────────────────────

function ImageBlock({ pair, index, total, onChange, onRemove, onMove }) {
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50 shadow-sm">
      <div className="px-4 py-2.5 flex items-center gap-3">
        <span className="text-xs font-black uppercase tracking-widest text-blue-600 shrink-0">
          IMG
        </span>
        {pair.imageUrl && (
          <img
            src={pair.imageUrl}
            alt={pair.imageAlt}
            className="h-10 w-14 object-cover rounded border border-blue-200 shrink-0"
          />
        )}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            type="text"
            value={pair.imageAlt}
            onChange={(e) => onChange(pair.id, "imageAlt", e.target.value)}
            placeholder="Alt-Text (Beschreibung)…"
            className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-400"
          />
          <input
            type="text"
            value={pair.imageTitle || ""}
            onChange={(e) => onChange(pair.id, "imageTitle", e.target.value)}
            placeholder="Title (Tooltip)…"
            className="w-full bg-white border border-blue-100 rounded px-2 py-1 text-xs text-gray-500 outline-none focus:border-blue-300"
          />
        </div>
        {/* Size */}
        <div className="flex gap-0.5 shrink-0">
          {IMG_SIZES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(pair.id, "imageWidth", value)}
              className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
                (pair.imageWidth || "100") === value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-blue-200 text-blue-400 hover:border-blue-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="w-px h-4 bg-blue-200 mx-1" />
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="w-6 h-6 flex items-center justify-center text-blue-300 hover:text-blue-600 disabled:opacity-30 rounded transition-colors"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="w-6 h-6 flex items-center justify-center text-blue-300 hover:text-blue-600 disabled:opacity-30 rounded transition-colors"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => onRemove(pair.id)}
          className="w-6 h-6 flex items-center justify-center text-blue-300 hover:text-red-500 rounded transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Individual Q&A pair card ──────────────────────────────────────────────

function QAPair({ pair, index, total, onChange, onRemove, onMove }) {
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
        <RichAnswerField
          value={pair.answer}
          onChange={(html) => onChange(pair.id, "answer", html)}
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

export default function InterviewEditor({
  value,
  onChange,
  onUrlInserted,
  title,
  subtitle,
  articleLegacyPath,
  articleId,
  hasSpanishContent,
  contentES,
  onChangeES,
  // Imágenes ya disponibles (p. ej. recortadas de un PDF) que se pueden insertar
  // inline sin volver a subirlas. Cada una: { id, url, title, alt }.
  // `onInsertAvailable(id)` debe subir/persistir y devolver la URL final (o null).
  availableImages = [],
  onInsertAvailable,
  // Modo split (from-pdf): abre el publilab a pantalla completa con un panel a la
  // izquierda (`leftPanel`, p. ej. el PDF) y divisor móvil, sin la pantalla de
  // bienvenida ni la card de preview. `apiRef.current` expone { appendText,
  // appendHeading } para insertar la selección del PDF como bloques.
  splitMode = false,
  leftPanel = null,
  apiRef = null,
  onClose,
}) {
  const [pairs, setPairs] = useState(() => htmlToQa(value));
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [lastBlocks, setLastBlocks] = useState(null);
  const [showSplash, setShowSplash] = useState(false);
  const [splashFading, setSplashFading] = useState(false);

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

  const handleImportFromPaste = (importedPairs, blocks, lang) => {
    const html = qaToHtml(importedPairs);
    if (lang === "es") {
      onChangeES && onChangeES(html);
    } else {
      setPairs(importedPairs);
      setLastBlocks(blocks ?? null);
      if (onUrlInserted) {
        importedPairs.forEach((p) => {
          if (p.isImage && p.imageUrl) onUrlInserted(p.imageUrl);
        });
      }
    }
    setShowPastePanel(false);
  };

  const questionCount = pairs.filter(
    (p) => !p.isSubtitle && !p.isImage && !p.isListBlock && !p.isPoemBlock,
  ).length;
  const blockCount = pairs.length;
  const hasContent = pairs.some(
    (p) =>
      p.question || p.answer || p.isImage || p.isListBlock || p.isPoemBlock,
  );

  const openEditor = () => {
    setShowSplash(true);
    setSplashFading(false);
    setTimeout(() => setSplashFading(true), 2600);
    setTimeout(() => setShowPastePanel(true), 2400);
    setTimeout(() => setShowSplash(false), 3400);
  };

  // Modo split: el publilab ES la pantalla completa (sin splash ni card).
  if (splitMode) {
    return (
      <PasteImportPanel
        onImport={(importedPairs, blocks, lang) => {
          // Emitir el HTML de inmediato: onClose desmonta el editor antes de que
          // el effect [pairs] dispare onChange, así que propagamos aquí de forma
          // sincrónica para no perder el cuerpo recién compuesto.
          if (lang === "es") {
            onChangeES && onChangeES(qaToHtml(importedPairs));
          } else {
            onChange(qaToHtml(importedPairs));
          }
          handleImportFromPaste(importedPairs, blocks, lang);
          onClose && onClose();
        }}
        onClose={() => onClose && onClose()}
        initialBlocks={hasContent ? pairsToBlocks(pairs) : []}
        articleTitle={title}
        articleSubtitle={subtitle}
        articleLegacyPath={articleLegacyPath}
        articleId={articleId}
        hasSpanishContent={hasSpanishContent}
        contentES={contentES}
        availableImages={availableImages}
        onInsertAvailable={onInsertAvailable}
        leftPanel={leftPanel}
        apiRef={apiRef}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Fullscreen publisher panel */}
      {showPastePanel && (
        <PasteImportPanel
          onImport={handleImportFromPaste}
          onClose={() => setShowPastePanel(false)}
          initialBlocks={
            lastBlocks ?? (hasContent ? pairsToBlocks(pairs) : null)
          }
          articleTitle={title}
          articleSubtitle={subtitle}
          articleLegacyPath={articleLegacyPath}
          articleId={articleId}
          hasSpanishContent={hasSpanishContent}
          contentES={contentES}
          availableImages={availableImages}
          onInsertAvailable={onInsertAvailable}
        />
      )}

      {/* Clickable preview area — THE main entry point */}
      <div
        onClick={openEditor}
        className="relative group border-2 border-dashed border-gray-200 hover:border-[#BD0E0D] rounded-xl cursor-pointer transition-colors overflow-hidden"
        style={{ minHeight: "160px" }}
      >
        {/* Edit overlay */}
        <div className="absolute inset-0 bg-transparent group-hover:bg-black/[0.02] transition-colors rounded-xl pointer-events-none" />
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-[#BD0E0D] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
            ✏️ Bearbeiten
          </span>
        </div>

        {hasContent ? (
          <div className="p-5 pointer-events-none">
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
              <span
                className="inline-flex items-baseline"
                style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
              >
                <span className="text-gray-400 font-normal text-xs">publ</span>
                <span className="font-black text-xs text-gray-700">ila</span>
                <span className="text-gray-400 font-normal text-xs">b</span>
              </span>
              <span className="text-[#BD0E0D] font-bold">
                {questionCount} F
              </span>
              {pairs.filter((p) => p.isSubtitle).length > 0 && (
                <span className="text-amber-500 font-bold">
                  {pairs.filter((p) => p.isSubtitle).length} T
                </span>
              )}
              <span>{blockCount} Blöcke</span>
            </div>
            {/* HTML preview */}
            <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed line-clamp-[12]">
              <Preview pairs={pairs} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
            <span className="text-4xl">✍️</span>
            <p className="text-gray-500 font-semibold text-sm">
              Klicken zum Schreiben
            </p>
            <p
              className="text-gray-400 text-xs"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              Öffnet den <span className="font-normal">publ</span>
              <span className="font-black text-gray-500">ila</span>
              <span className="font-normal">b</span> — Vollbild-Editor
            </p>
          </div>
        )}
      </div>

      {/* publilab splash overlay */}
      {showSplash && (
        <>
          <style>{`
            @keyframes plb-reveal {
              from { clip-path: inset(110% 0 0 0); transform: translateY(12px); }
              to   { clip-path: inset(0% 0 0 0);   transform: translateY(0); }
            }
            @keyframes plb-line {
              from { transform: scaleX(0); opacity: 0; }
              to   { transform: scaleX(1); opacity: 1; }
            }
            @keyframes plb-sub {
              from { opacity: 0; letter-spacing: 0.25em; }
              to   { opacity: 0.35; letter-spacing: 0.45em; }
            }
            @keyframes plb-progress {
              0%   { width: 0%; }
              15%  { width: 28%; }
              35%  { width: 52%; }
              60%  { width: 74%; }
              80%  { width: 88%; }
              95%  { width: 96%; }
              100% { width: 100%; }
            }
            @keyframes plb-progress-glow {
              0%, 100% { opacity: 0.7; }
              50%       { opacity: 1; }
            }
          `}</style>
          <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-[700ms] ${splashFading ? "opacity-0" : "opacity-100"}`}
            style={{ background: "#0d0d0d" }}
          >
            {/* Logo */}
            <div style={{ overflow: "hidden", paddingBottom: "4px" }}>
              <span
                className="select-none"
                style={{
                  fontFamily: "Futura Cyrillic, Arial, sans-serif",
                  fontSize: "88px",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  display: "inline-block",
                  animation:
                    "plb-reveal 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both",
                }}
              >
                <span style={{ color: "#6b7280", fontWeight: 600 }}>publ</span>
                <span style={{ color: "#ffffff", fontWeight: 900 }}>ila</span>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>b</span>
              </span>
            </div>

            {/* Thin line */}
            <div
              style={{
                marginTop: "14px",
                width: "80px",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, #ffffff60, transparent)",
                transformOrigin: "center",
                animation:
                  "plb-line 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both",
              }}
            />

            {/* Tagline */}
            <div
              style={{
                marginTop: "14px",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                animation: "plb-sub 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s both",
              }}
            >
              publilabor editorial v.1.4
            </div>

            {/* Progress bar */}
            <div
              style={{
                marginTop: "32px",
                width: "160px",
                height: "2px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "99px",
                overflow: "hidden",
                animation: "plb-sub 0.4s ease 0.7s both",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #ffffff80, #ffffff)",
                  borderRadius: "99px",
                  animation:
                    "plb-progress 2.4s cubic-bezier(0.4,0,0.2,1) 0.7s both, plb-progress-glow 0.8s ease-in-out 0.7s infinite",
                  boxShadow: "0 0 8px rgba(255,255,255,0.4)",
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
