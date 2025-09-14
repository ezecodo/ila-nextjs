import React, { useEffect, useRef } from "react";
import Quill from "quill";
import Delta from "quill-delta"; // 👈 importante: npm install quill-delta
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
            ["link"], // Hipervínculos
            ["image"],
          ],
        },
        placeholder: t("writeHere"),
      });

      // 🧹 Limpiar pegado: permitir solo párrafos y encabezados
      quillRef.current.clipboard.addMatcher(Node.ELEMENT_NODE, (node) => {
        const tag = node.tagName ? node.tagName.toLowerCase() : "";

        // Conservar encabezados
        if (/^h[1-6]$/.test(tag)) {
          const level = parseInt(tag[1]);
          return new Delta().insert(node.innerText || node.textContent || "", {
            header: level,
          });
        }

        // Conservar párrafos
        if (tag === "p") {
          return new Delta().insert(node.innerText || node.textContent || "\n");
        }

        // Todo lo demás → texto plano
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
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      const selection = quillRef.current.getSelection();
      const cursorPosition = selection ? selection.index : 0;

      quillRef.current.root.innerHTML = value || "";

      setTimeout(() => {
        quillRef.current.setSelection(cursorPosition, 0);
      }, 0);
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
