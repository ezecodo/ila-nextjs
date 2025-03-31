import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const QuillEditor = ({ onChange, resetTrigger }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    // Inicialización de Quill
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
        placeholder: "Escribe aquí...",
      });

      // Escuchar cambios en Quill
      quillRef.current.on("text-change", () => {
        const plainText = quillRef.current.getText().trim(); // Obtiene solo texto limpio
        onChange(plainText); // Envía texto limpio al formulario
      });
    }
  }, [onChange]);

  useEffect(() => {
    // Reiniciar contenido del editor cuando cambia `resetTrigger`
    if (quillRef.current && resetTrigger) {
      quillRef.current.root.innerHTML = "";
    }
  }, [resetTrigger]);

  return <div ref={editorRef} style={{ height: "300px" }}></div>;
};

export default QuillEditor;
