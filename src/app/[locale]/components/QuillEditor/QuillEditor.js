import React, { useEffect, useRef } from "react";
import Quill from "quill";
import Delta from "quill-delta";

import "quill/dist/quill.snow.css";
import { useTranslations } from "next-intl";

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
          ],
        },
        placeholder: t("writeHere"),
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
      quillRef.current.root.addEventListener("paste", (e) => {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        const text = clipboardData.getData("text/plain");
        const html = clipboardData.getData("text/html");

        // Si hay HTML, procesarlo con el matcher de Quill
        if (html) {
          const range = quillRef.current.getSelection(true);
          quillRef.current.clipboard.dangerouslyPasteHTML(range.index, html);
          return;
        }

        // Si solo hay texto plano, procesar los saltos de línea
        if (text) {
          const selection = quillRef.current.getSelection();
          const cursorPosition = selection ? selection.index : 0;

          // Dividir en párrafos basados en dobles saltos de línea
          const paragraphs = text.split(/\n\s*\n/);

          let newDelta = new Delta().retain(cursorPosition);

          paragraphs.forEach((paragraph, index) => {
            if (paragraph.trim()) {
              // Insertar el párrafo
              newDelta = newDelta.insert(paragraph.trim());

              // Agregar salto de párrafo excepto después del último párrafo
              if (index < paragraphs.length - 1) {
                newDelta = newDelta.insert("\n", { block: true });
              }
            }
          });

          quillRef.current.updateContents(newDelta, "user");
          quillRef.current.setSelection(cursorPosition + text.length, 0);
        }
      });

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
