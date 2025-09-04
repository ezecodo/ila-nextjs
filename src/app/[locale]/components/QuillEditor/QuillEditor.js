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
            ["link", "image"],
          ],
        },
        placeholder: t("writeHere"),
      });

      // 👇 forzar left-to-right
      quillRef.current.root.setAttribute("dir", "ltr");
      quillRef.current.root.style.textAlign = "left";

      // Escuchar cambios en Quill
      quillRef.current.on("text-change", () => {
        const html = quillRef.current.root.innerHTML;
        if (onChange) onChange(html);
      });
    }
  }, [onChange, t]);

  // Si `value` cambia desde fuera → actualizamos contenido del editor
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || "";
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
