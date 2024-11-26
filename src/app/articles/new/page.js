"use client";

import { useState } from "react";
import styles from "./NewArticlePage.module.css";

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      setMessage("Artículo creado con éxito.");
      setTitle("");
      setContent("");
    } else {
      const errorData = await res.json();
      setMessage(`Error: ${errorData.error}`);
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
        <button type="submit" className={styles.submitButton}>
          Crear artículo
        </button>
      </form>
    </div>
  );
}
