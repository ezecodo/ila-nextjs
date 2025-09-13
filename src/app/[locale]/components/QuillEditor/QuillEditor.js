import React, { useEffect, useRef } from "react";
import Quill from "quill";
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
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic", "underline"],
            ["link"], // Hipervínculos
            ["image"],
          ],
        },
        placeholder: t("writeHere"),
      });

      // 👇 ENVIAR HTML CON URLs ABSOLUTAS
      quillRef.current.on("text-change", () => {
        let htmlContent = quillRef.current.root.innerHTML;

        // Convertir URLs relativas a absolutas
        htmlContent = htmlContent.replace(
          /href="(?!https?:\/\/)([^"]*)"/g,
          (match, url) => {
            if (url.startsWith("www.")) {
              return `href="https://${url}"`;
            }
            // Para otras URLs relativas, agregar https://
            return `href="https://${url}"`;
          }
        );

        if (onChange) onChange(htmlContent);
      });
    }
  }, [onChange, t]);

  // 👇 ACTUALIZAR: Sincronizar con HTML en lugar de texto plano
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      // GUARDAR POSICIÓN ACTUAL DEL CURSOR
      const selection = quillRef.current.getSelection();
      const cursorPosition = selection ? selection.index : 0;

      // ACTUALIZAR CONTENIDO CON HTML
      quillRef.current.root.innerHTML = value || "";

      // RESTAURAR POSICIÓN DEL CURSOR
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
