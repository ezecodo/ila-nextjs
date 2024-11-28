"use client";

import { useState, useEffect } from "react";
import styles from "./NewArticlePage.module.css";

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [beitragstypen, setBeitragstypen] = useState([]);
  const [selectedBeitragstyp, setSelectedBeitragstyp] = useState("");
  const [subtypen, setSubtypen] = useState([]);
  const [selectedSubtyp, setSelectedSubtyp] = useState("");
  const [isPrinted, setIsPrinted] = useState(false);
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [authors, setAuthors] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [message, setMessage] = useState("");

  // Cargar los Beitragstypen y subtipos desde la API
  useEffect(() => {
    const fetchBeitragstypen = async () => {
      try {
        const res = await fetch("/api/beitragstypen");
        if (res.ok) {
          const data = await res.json();
          setBeitragstypen(data);
        } else {
          console.error("Error al cargar los tipos de artículo.");
          setMessage("Error al cargar los tipos de artículo.");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchBeitragstypen();
  }, []);

  // Actualizar los subtipos según el tipo seleccionado
  useEffect(() => {
    if (selectedBeitragstyp) {
      const selected = beitragstypen.find(
        (typ) => typ.id === parseInt(selectedBeitragstyp, 10)
      );
      setSubtypen(selected?.subtypes || []);
    } else {
      setSubtypen([]);
    }
  }, [selectedBeitragstyp, beitragstypen]);

  // Cargar ediciones desde la API
  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const res = await fetch("/api/editions");
        if (res.ok) {
          const data = await res.json();
          setEditions(data);
        } else {
          console.error("Error al cargar las ediciones.");
          setMessage("Error al cargar las ediciones.");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchEditions();
  }, []);

  // Cargar autores desde la API
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch("/api/authors");
        if (res.ok) {
          const data = await res.json();
          setAuthors(data);
        } else {
          console.error("Error al cargar los autores.");
          setMessage("Error al cargar los autores.");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchAuthors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBeitragstyp) {
      setMessage("Seleccione un tipo de artículo.");
      return;
    }

    if (isPrinted && (!selectedEdition || !startPage || !endPage)) {
      setMessage(
        "Complete todos los campos relacionados con la edición impresa."
      );
      return;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          content,
          beitragstypId: selectedBeitragstyp,
          beitragssubtypId: selectedSubtyp || null,
          isPrinted,
          editionId: isPrinted ? parseInt(selectedEdition, 10) : null,
          startPage: isPrinted ? parseInt(startPage, 10) : null,
          endPage: isPrinted ? parseInt(endPage, 10) : null,
          authorId: selectedAuthor ? parseInt(selectedAuthor, 10) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage("Artículo creado con éxito.");
        console.log("Artículo creado:", data);

        // Reiniciar los estados
        setTitle("");
        setSubtitle("");
        setContent("");
        setSelectedBeitragstyp("");
        setSelectedSubtyp("");
        setIsPrinted(false);
        setSelectedEdition("");
        setStartPage("");
        setEndPage("");
        setSelectedAuthor("");
      } else {
        const errorData = await res.json().catch(() => null);
        setMessage(
          errorData?.error || "Error desconocido al crear el artículo."
        );
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setMessage("Error al enviar los datos.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.formTitle}>Crear un nuevo artículo</h1>
      {message && <p className={styles.message}>{message}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.formLabel}>
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ingrese el título"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="subtitle" className={styles.formLabel}>
            Subtítulo
          </label>
          <input
            id="subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Ingrese el subtítulo"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.formLabel}>
            Contenido
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ingrese el contenido"
            className={styles.textarea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="authors" className={styles.formLabel}>
            Seleccionar autor
          </label>
          <select
            id="authors"
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className={styles.select}
          >
            <option value="">Seleccione un autor</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="beitragstyp" className={styles.formLabel}>
            Tipo de Artículo
          </label>
          <select
            id="beitragstyp"
            value={selectedBeitragstyp}
            onChange={(e) => setSelectedBeitragstyp(e.target.value)}
            className={styles.select}
          >
            <option value="">Seleccione un tipo</option>
            {beitragstypen.map((typ) => (
              <option key={typ.id} value={typ.id}>
                {typ.name}
              </option>
            ))}
          </select>
        </div>
        {subtypen.length > 0 && (
          <div className={styles.formGroup}>
            <label htmlFor="subtyp" className={styles.formLabel}>
              Subtipo de Artículo
            </label>
            <select
              id="subtyp"
              value={selectedSubtyp}
              onChange={(e) => setSelectedSubtyp(e.target.value)}
              className={styles.select}
            >
              <option value="">Seleccione un subtipo</option>
              {subtypen.map((subtyp) => (
                <option key={subtyp.id} value={subtyp.id}>
                  {subtyp.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.formGroup}>
          <label htmlFor="isPrinted" className={styles.formLabel}>
            ¿Está en la versión impresa?
          </label>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={isPrinted}
              onChange={(e) => setIsPrinted(e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        {isPrinted && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="edition" className={styles.formLabel}>
                Edición de la revista
              </label>
              <select
                id="edition"
                value={selectedEdition}
                onChange={(e) => setSelectedEdition(e.target.value)}
                className={styles.select}
              >
                <option value="">Seleccione una edición</option>
                {editions.map((edition) => (
                  <option key={edition.id} value={edition.id}>
                    {edition.number} - {edition.title}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="startPage" className={styles.formLabel}>
                Página de inicio
              </label>
              <input
                id="startPage"
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                placeholder="Página de inicio"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endPage" className={styles.formLabel}>
                Página de fin
              </label>
              <input
                id="endPage"
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                placeholder="Página de fin"
                className={styles.input}
              />
            </div>
          </>
        )}
        <button type="submit" className={styles.submitButton}>
          Crear artículo
        </button>
      </form>
    </div>
  );
}
