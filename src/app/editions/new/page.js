"use client";

import { useState } from "react";

export default function NewEditionForm() {
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState(""); // Estado para el subtítulo
  const [datePublished, setDatePublished] = useState("");
  const [year, setYear] = useState(""); // Nuevo estado para el año
  const [summary, setSummary] = useState(""); // Nuevo estado para el resumen
  const [tableOfContents, setTableOfContents] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coverImage || !backgroundImage) {
      alert("Por favor, sube ambas imágenes.");
      return;
    }

    const formData = new FormData();
    formData.append("number", number);
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("datePublished", datePublished);
    formData.append("year", year);
    formData.append("summary", summary);
    formData.append("tableOfContents", tableOfContents);
    formData.append("isCurrent", isCurrent);
    formData.append("coverImage", coverImage);
    formData.append("backgroundImage", backgroundImage);

    try {
      const res = await fetch("/api/editions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Edición creada con éxito:", data);
        alert("Edición creada con éxito.");
      } else {
        const errorText = await res.text();
        console.error("Error al crear la edición:", errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Error al enviar los datos.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="number">Número:</label>
        <input
          type="number"
          id="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="title">Título:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="subtitle">Subtítulo:</label>
        <input
          type="text"
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="datePublished">Fecha de Publicación:</label>
        <input
          type="date"
          id="datePublished"
          value={datePublished}
          onChange={(e) => setDatePublished(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="year">Año:</label>
        <input
          type="number"
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="summary">Resumen:</label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        ></textarea>
      </div>
      <div>
        <label htmlFor="tableOfContents">Tabla de Contenidos:</label>
        <textarea
          id="tableOfContents"
          value={tableOfContents}
          onChange={(e) => setTableOfContents(e.target.value)}
        ></textarea>
      </div>
      <div>
        <label htmlFor="isCurrent">¿Es la edición actual?</label>
        <input
          type="checkbox"
          id="isCurrent"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
        />
      </div>
      <div>
        <label htmlFor="coverImage">Imagen de Portada:</label>
        <input
          type="file"
          id="coverImage"
          onChange={(e) => setCoverImage(e.target.files[0])}
          required
        />
      </div>
      <div>
        <label htmlFor="backgroundImage">Imagen de Fondo:</label>
        <input
          type="file"
          id="backgroundImage"
          onChange={(e) => setBackgroundImage(e.target.files[0])}
          required
        />
      </div>
      <button type="submit">Crear Edición</button>
    </form>
  );
}
