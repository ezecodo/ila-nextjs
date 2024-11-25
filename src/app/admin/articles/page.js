"use client";

import { useState, useEffect } from "react";

export default function ArticlesAdmin() {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    previewText: "",
    content: "",
    additionalInfo: "",
    authorId: "",
    typeId: "",
  });

  const [authors, setAuthors] = useState([]);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [useNewAuthor, setUseNewAuthor] = useState(false);

  // Cargar autores existentes
  useEffect(() => {
    async function fetchAuthors() {
      const res = await fetch("/api/authors"); // Endpoint para obtener autores
      const data = await res.json();
      setAuthors(data);
    }

    fetchAuthors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar si se está creando un autor nuevo
    let authorId = formData.authorId;
    if (useNewAuthor && newAuthorName.trim()) {
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newAuthorName }),
      });
      const newAuthor = await res.json();
      authorId = newAuthor.id;
    }

    // Enviar los datos del artículo
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...formData, authorId }),
    });

    if (res.ok) {
      alert("Artículo creado con éxito");
      setFormData({
        title: "",
        subtitle: "",
        previewText: "",
        content: "",
        additionalInfo: "",
        authorId: "",
        typeId: "",
      });
      setNewAuthorName("");
      setUseNewAuthor(false);
    } else {
      alert("Error al crear el artículo");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Administrar Artículos</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Título</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título"
          required
          style={styles.input}
        />
        <label style={styles.label}>Subtítulo</label>
        <input
          name="subtitle"
          value={formData.subtitle}
          onChange={handleChange}
          placeholder="Subtítulo"
          style={styles.input}
        />
        <label style={styles.label}>Autor</label>
        <div>
          <input
            type="radio"
            id="existing-author"
            checked={!useNewAuthor}
            onChange={() => setUseNewAuthor(false)}
          />
          <label htmlFor="existing-author">Seleccionar autor existente</label>
          {authors.length > 0 && (
            <select
              name="authorId"
              value={formData.authorId}
              onChange={handleChange}
              style={styles.select}
              disabled={useNewAuthor}
            >
              <option value="">Seleccionar...</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <input
            type="radio"
            id="new-author"
            checked={useNewAuthor}
            onChange={() => setUseNewAuthor(true)}
          />
          <label htmlFor="new-author">Agregar nuevo autor</label>
          <input
            type="text"
            placeholder="Nombre del nuevo autor"
            value={newAuthorName}
            onChange={(e) => setNewAuthorName(e.target.value)}
            style={styles.input}
            disabled={!useNewAuthor}
          />
        </div>
        <label style={styles.label}>Texto de vista previa</label>
        <textarea
          name="previewText"
          value={formData.previewText}
          onChange={handleChange}
          placeholder="Texto de vista previa"
          style={styles.textarea}
        />
        <label style={styles.label}>Contenido</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Contenido"
          required
          style={styles.textarea}
        />
        <label style={styles.label}>ID del tipo</label>
        <input
          name="typeId"
          value={formData.typeId}
          onChange={handleChange}
          placeholder="ID del tipo"
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Guardar
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
    fontSize: "24px",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "4px",
  },
  select: {
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginBottom: "10px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  textarea: {
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "80px",
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#007BFF",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
