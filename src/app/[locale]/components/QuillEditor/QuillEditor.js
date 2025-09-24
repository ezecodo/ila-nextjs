import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import Delta from "quill-delta";

import "quill/dist/quill.snow.css";
import { useTranslations } from "next-intl";

// 🔥 NUEVO: Registrar formato para líneas con puntuación
const Inline = Quill.import("blots/inline");
const Block = Quill.import("blots/block");

class DossierBlot extends Inline {}
DossierBlot.blotName = "dossier";
DossierBlot.tagName = "span";
Quill.register(DossierBlot);

class PunctuatedLineBlot extends Inline {
  static create() {
    return super.create();
  }
}
PunctuatedLineBlot.blotName = "punctuated-line";
PunctuatedLineBlot.tagName = "span";
PunctuatedLineBlot.className = "punctuated-line";
Quill.register(PunctuatedLineBlot);

class PoemBlot extends Block {}
PoemBlot.blotName = "poem";
PoemBlot.tagName = "div";
PoemBlot.className = "poem";
Quill.register(PoemBlot);

const icons = Quill.import("ui/icons");
icons["poem"] = "📜"; // 👈 puede ser emoji o un SVG
icons["dossier"] = "📕"; //

const QuillEditor = ({ value = "", onChange, resetTrigger }) => {
  const t = useTranslations("quilleditor");

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // ✅ aquí dentro van tus states
  const [editions, setEditions] = useState([]);
  const [showEditionModal, setShowEditionModal] = useState({
    open: false,
    range: null,
  });
  // ✅ aquí metemos el fetch
  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const res = await fetch("/api/editions");
        if (res.ok) {
          const data = await res.json();
          const sorted = data.sort((a, b) => b.number - a.number);
          setEditions(sorted);
        }
      } catch (err) {
        console.error("Error cargando ediciones", err);
      }
    };

    fetchEditions();
  }, []);

  // Inicialización de Quill
  useEffect(() => {
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: "1" }, { header: "2" }, { header: "3" }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic"],
            ["link"],
            ["image"],
            ["poem"],
            ["dossier"],
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

      // 👉 Handler para Dossier

      toolbar.addHandler("dossier", () => {
        console.log("CLICK EN 📕"); // debería salir en consola
        const range = quillRef.current.getSelection();
        if (!range || range.length === 0) {
          alert(
            "Selecciona primero el texto que quieres enlazar a un dossier."
          );
          return;
        }
        setShowEditionModal({ open: true, range });
      });
      // 👇 NUEVO: detectar títulos al pegar texto plano
      quillRef.current.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
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

  return (
    <>
      <div ref={editorRef} style={{ height: "300px" }}></div>

      {/* ✅ Modal de selección de Dossier */}
      {showEditionModal.open && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditionModal({ open: false, range: null });
            }
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              maxHeight: "400px",
              overflowY: "auto",
              minWidth: "300px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Selecciona un dossier</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {editions.map((edition) => (
                <li
                  key={edition.id}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => {
                    if (!showEditionModal.range) return;
                    const { index, length } = showEditionModal.range;
                    const selectedText = quillRef.current.getText(
                      index,
                      length
                    );

                    // 👇 Elimina el texto seleccionado y vuelve a insertarlo con formato "link"
                    quillRef.current.deleteText(index, length);
                    quillRef.current.insertText(index, selectedText, {
                      link: `/editions/${edition.id}`,
                      "data-ila": "edition",
                      "data-id": edition.id,
                    });

                    // 👌 Cerrar modal
                    setShowEditionModal({ open: false, range: null });
                  }}
                >
                  <strong>ila {edition.number}</strong> – {edition.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default QuillEditor;
