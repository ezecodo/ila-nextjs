import React, { useEffect, useRef } from "react";
import Quill from "quill";
import Delta from "quill-delta";

import "quill/dist/quill.snow.css";
import { useTranslations } from "next-intl";
// 🔥 NUEVO: Registrar formato para líneas con puntuación
const Inline = Quill.import("blots/inline");
class PunctuatedLineBlot extends Inline {
  static create() {
    return super.create();
  }
}
PunctuatedLineBlot.blotName = "punctuated-line";
PunctuatedLineBlot.tagName = "span";
PunctuatedLineBlot.className = "punctuated-line";
Quill.register(PunctuatedLineBlot);
const Block = Quill.import("blots/block");

class PoemBlot extends Block {}
PoemBlot.blotName = "poem";
PoemBlot.tagName = "div";
PoemBlot.className = "poem";

Quill.register(PoemBlot);
const icons = Quill.import("ui/icons");
icons["poem"] = "📜"; // 👈 puede ser emoji o un SVG

const QuillEditor = ({ value = "", onChange, resetTrigger }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const t = useTranslations("quilleditor");

  // Inicialización de Quill
  useEffect(() => {
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: "1" }, { header: "2" }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["image"],
            ["poem"],
          ],
        },
        placeholder: t("writeHere"),
      });
      // Añadir handler para el botón "poem"
      const toolbar = quillRef.current.getModule("toolbar");
      toolbar.addHandler("poem", () => {
        const range = quillRef.current.getSelection();
        if (range && range.length > 0) {
          const selectedText = quillRef.current.getText(
            range.index,
            range.length
          );
          const lines = selectedText.split("\n");

          quillRef.current.deleteText(range.index, range.length);

          let index = range.index;

          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const endsWithPunctuation = /[.!?]$/.test(trimmed);

            // 👇 Insertamos solo el texto sin salto manual
            quillRef.current.insertText(index, trimmed, "poem", true);
            index += trimmed.length;

            // 👇 Para párrafos que terminan con punto → salto doble
            if (endsWithPunctuation) {
              quillRef.current.insertText(index, "\n\n", "poem", true);
              index += 2;
            } else if (idx < lines.length - 1) {
              // 👇 Si no es la última línea, salto simple
              quillRef.current.insertText(index, "\n", "poem", true);
              index += 1;
            }
          });
        } else if (range) {
          quillRef.current.format("poem", true);
        }
      });
      // 👇 NUEVO: detectar títulos al pegar texto plano
      quillRef.current.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
        const text = (node.data || "").trim();

        const isHeading =
          text.length > 0 &&
          text.length < 120 &&
          /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text) &&
          !/[.!?]$/.test(text);

        if (isHeading) {
          return new Delta().insert(text + "\n", { header: 2 });
        }

        return delta;
      });

      // 🔧 MANEJADOR DE PEGADO SIMPLIFICADO Y MEJORADO

      // 🧹 LIMPIAR HTML PEGADO - mantener solo estructura básica
      quillRef.current.clipboard.addMatcher(Node.ELEMENT_NODE, (node) => {
        const tagName = node.tagName ? node.tagName.toLowerCase() : "";

        // Permitir encabezados
        if (/^h[1-6]$/.test(tagName)) {
          const level = parseInt(tagName[1]);
          return new Delta().insert(node.innerText || node.textContent || "", {
            header: level,
          });
        }

        // Permitir párrafos
        if (tagName === "p" || tagName === "div") {
          const text = node.innerText || node.textContent || "";
          if (text.trim()) {
            return new Delta().insert(text + "\n");
          }
          return new Delta().insert("\n");
        }

        // Permitir listas
        if (tagName === "li") {
          const text = node.innerText || node.textContent || "";
          return new Delta().insert(text + "\n");
        }

        // Para otros elementos, solo tomar el texto
        return new Delta().insert(node.innerText || node.textContent || "");
      });

      // 👇 ENVIAR HTML
      quillRef.current.on("text-change", () => {
        let htmlContent = quillRef.current.root.innerHTML;

        // Convertir URLs relativas a absolutas
        htmlContent = htmlContent.replace(
          /href="(?!https?:\/\/)([^"]*)"/g,
          (match, url) => {
            if (url.startsWith("www.")) {
              return `href="https://${url}"`;
            }
            return `href="https://${url}"`;
          }
        );

        if (onChange) onChange(htmlContent);
      });
    }
  }, [onChange, t]);

  // 👇 ACTUALIZAR
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const editorHtml = quillRef.current.root.innerHTML.trim();
      let incoming = (value || "").trim();

      if (editorHtml !== incoming) {
        const selection = quillRef.current.getSelection();
        const cursorPosition = selection ? selection.index : 0;

        quillRef.current.root.innerHTML = incoming || "";

        setTimeout(() => {
          quillRef.current.setSelection(cursorPosition, 0);
        }, 0);
      }
    }
  }, [value]);

  // Reset con resetTrigger
  useEffect(() => {
    if (quillRef.current && resetTrigger) {
      quillRef.current.root.innerHTML = "";
    }
  }, [resetTrigger]);

  return <div ref={editorRef} style={{ height: "300px" }}></div>;
};

export default QuillEditor;
