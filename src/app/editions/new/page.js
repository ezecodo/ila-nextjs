"use client";

import { useState } from "react";
import InputField from "../../components/InputField";
import TextAreaField from "../../components/TextAreaField";
import CheckboxField from "../../components/CheckboxField";
import SubmitButton from "../../components/SubmitButton";

import styles from "../../styles/global.module.css";

export default function NewEditionPage() {
  const [isCurrent, setIsCurrent] = useState(false);
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [datePublished, setDatePublished] = useState("");
  const [year, setYear] = useState("");
  const [summary, setSummary] = useState("");
  const [tableOfContents, setTableOfContents] = useState("");
  const [isOrderable, setIsOrderable] = useState(false);
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación básica
    if (!number || !title || !summary) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }

    const formData = new FormData();
    formData.append("isCurrent", isCurrent);
    formData.append("number", number);
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("datePublished", datePublished);
    formData.append("year", year);
    formData.append("summary", summary);
    formData.append("tableOfContents", tableOfContents);
    formData.append("isOrderable", isOrderable);
    formData.append("isDiscounted", isDiscounted);
    if (coverImage) formData.append("coverImage", coverImage);
    if (backgroundImage) formData.append("backgroundImage", backgroundImage);

    try {
      const response = await fetch("/api/editions", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Edición creada con éxito.");
        // Resetear formulario
      } else {
        alert("Hubo un error al crear la edición.");
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
  };

  return (
    <div>
      <h1>Crear una nueva edición</h1>
      <form onSubmit={handleSubmit}>
        <CheckboxField
          id="isCurrent"
          label="¿Es la edición actual?"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
        />
        <InputField
          id="number"
          label="Número de la revista"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Ingrese el número"
        />
        <InputField
          id="title"
          label="Título de la edición"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ingrese el título"
        />
        <InputField
          id="subtitle"
          label="Subtítulo (opcional)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Ingrese el subtítulo"
        />
        <InputField
          id="datePublished"
          label="Fecha de publicación"
          type="date"
          value={datePublished}
          onChange={(e) => setDatePublished(e.target.value)}
        />
        <InputField
          id="year"
          label="Año"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Ingrese el año"
        />
        <TextAreaField
          id="summary"
          label="Resumen"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Ingrese el resumen"
        />
        <TextAreaField
          id="tableOfContents"
          label="Tabla de contenido"
          value={tableOfContents}
          onChange={(e) => setTableOfContents(e.target.value)}
          placeholder="Ingrese la tabla de contenido"
        />
        <CheckboxField
          id="isOrderable"
          label="¿Disponible para ordenar?"
          checked={isOrderable}
          onChange={(e) => setIsOrderable(e.target.checked)}
        />
        <CheckboxField
          id="isDiscounted"
          label="¿Precio reducido?"
          checked={isDiscounted}
          onChange={(e) => setIsDiscounted(e.target.checked)}
        />
        <FileUploadField
          id="coverImage"
          label="Portada"
          onChange={(e) => setCoverImage(e.target.files[0])}
        />
        <FileUploadField
          id="backgroundImage"
          label="Imagen de fondo"
          onChange={(e) => setBackgroundImage(e.target.files[0])}
        />
        <SubmitButton label="Crear edición" />
      </form>
    </div>
  );
}
