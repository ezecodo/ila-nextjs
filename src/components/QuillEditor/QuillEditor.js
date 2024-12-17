import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const QuillEditor = ({ onChange }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

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
        placeholder: "Escribe aquí...",
      });

      quillRef.current.on("text-change", () => {
        const htmlContent = quillRef.current.root.innerHTML;

        // Convertir HTML a texto plano con saltos de línea
        const plainText = htmlContent
          .replace(/<br>/g, "\n") // Reemplaza <br> con \n
          .replace(/<\/p><p>/g, "\n") // Reemplaza </p><p> con \n
          .replace(/<\/?p>/g, "") // Elimina etiquetas <p>
          .trim();

        onChange(plainText); // Envía el texto plano al formulario
      });
    }
  }, [onChange]);

  return <div ref={editorRef} style={{ height: "300px" }}></div>;
};

export default QuillEditor;
