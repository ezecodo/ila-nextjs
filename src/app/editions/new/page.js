"use client";

import { useState } from "react";
import dynamic from "next/dynamic"; // Importación dinámica
import InputField from "../../components/InputField";
import TextAreaField from "../../components/TextAreaField";
import ToggleSwitch from "../../components/ToggleSwitch";
import SubmitButton from "../../components/SubmitButton";
import FormMessage from "../../components/FormMessage";
import AsyncSelect from "react-select/async"; // Importamos AsyncSelect
import "react-datepicker/dist/react-datepicker.css"; // Estilos de react-datepicker
import styles from "../../styles/global.module.css";

// Importación dinámica del DatePicker
const DatePicker = dynamic(
  () => import("react-datepicker").then((mod) => mod.default),
  { ssr: false }
);

export default function NewEditionForm() {
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [isAvailableToOrder, setIsAvailableToOrder] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [datePublished, setDatePublished] = useState(null);
  const [summary, setSummary] = useState("");
  const [tableOfContents, setTableOfContents] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [region, setRegion] = useState(null);
  const [message, setMessage] = useState("");

  const flattenRegions = (regions, parentName = "") => {
    const options = [];

    regions.forEach((region) => {
      const label = parentName ? `${parentName} > ${region.name}` : region.name;

      options.push({
        value: region.id,
        label,
      });

      if (region.children && region.children.length > 0) {
        options.push(...flattenRegions(region.children, label));
      }
    });

    return options;
  };

  const loadRegions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await fetch(`/api/regions?search=${inputValue}`);
      const data = await response.json();

      return flattenRegions(data);
    } catch (error) {
      console.error("Error al cargar regiones:", error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coverImage || !backgroundImage) {
      setMessage("Por favor, sube ambas imágenes.");
      return;
    }

    if (!datePublished) {
      setMessage("Por favor, selecciona la fecha de publicación.");
      return;
    }

    const formattedDatePublished = datePublished
      ? `${datePublished.getFullYear()}-${String(
          datePublished.getMonth() + 1
        ).padStart(2, "0")}`
      : "";

    const formData = new FormData();
    formData.append("number", number);
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("isAvailableToOrder", isAvailableToOrder);
    formData.append("datePublished", formattedDatePublished);
    formData.append("summary", summary);
    formData.append("tableOfContents", tableOfContents);
    formData.append("isCurrent", isCurrent);
    formData.append("coverImage", coverImage);
    formData.append("backgroundImage", backgroundImage);

    if (region) {
      formData.append("regionId", region.value);
    }

    try {
      const res = await fetch("/api/editions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("Edición creada con éxito.");
        alert("Edición creada con éxito.");
      } else {
        const errorText = await res.text();
        setMessage(`Error al crear la edición: ${errorText}`);
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Error al enviar los datos.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.formTitle}>Crear una nueva edición</h1>
      {message && <FormMessage message={message} />}
      <form onSubmit={handleSubmit} className={styles.form}>
        <InputField
          id="number"
          label="Número de Edición"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Ingrese el número de la edición"
          required
        />
        <InputField
          id="title"
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ingrese el título de la edición"
          required
        />
        <InputField
          id="subtitle"
          label="Subtítulo"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Ingrese un subtítulo (opcional)"
        />
        <div className={styles.formGroup}>
          <label htmlFor="datePublished" className={styles.formLabel}>
            Fecha de Publicación (Mes y Año)
          </label>
          <DatePicker
            selected={datePublished}
            onChange={(date) => setDatePublished(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className={styles.input}
            placeholderText="Selecciona el mes y año"
          />
        </div>

        <TextAreaField
          id="summary"
          label="Resumen"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Ingrese el resumen de la edición"
          required
        />
        <TextAreaField
          id="tableOfContents"
          label="Tabla de Contenidos"
          value={tableOfContents}
          onChange={(e) => setTableOfContents(e.target.value)}
          placeholder="Ingrese la tabla de contenidos (opcional)"
        />
        <ToggleSwitch
          id="isCurrent"
          label="¿Es la edición actual?"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
        />
        <ToggleSwitch
          id="isAvailableToOrder"
          label="¿Disponible para pedir?"
          checked={isAvailableToOrder}
          onChange={(e) => setIsAvailableToOrder(e.target.checked)}
        />
        <div className={styles.formGroup}>
          <label htmlFor="region" className={styles.formLabel}>
            Categoría de Región:
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadRegions}
            onChange={(selectedOption) => setRegion(selectedOption)}
            placeholder="Escriba para buscar regiones"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="coverImage" className={styles.formLabel}>
            Imagen de Portada:
          </label>
          <input
            type="file"
            id="coverImage"
            onChange={(e) => setCoverImage(e.target.files[0])}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="backgroundImage" className={styles.formLabel}>
            Imagen de Fondo:
          </label>
          <input
            type="file"
            id="backgroundImage"
            onChange={(e) => setBackgroundImage(e.target.files[0])}
            className={styles.input}
            required
          />
        </div>
        <SubmitButton label="Crear Edición" />
      </form>
    </div>
  );
}
