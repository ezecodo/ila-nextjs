"use client";

import { useState } from "react";
import InputField from "../../components/InputField";
import TextAreaField from "../../components/TextAreaField";
import ToggleSwitch from "../../components/ToggleSwitch";
import SubmitButton from "../../components/SubmitButton";
import FormMessage from "../../components/FormMessage";
import AsyncSelect from "react-select/async"; // Importamos AsyncSelect
import styles from "../../styles/global.module.css";

export default function NewEditionForm() {
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [datePublished, setDatePublished] = useState("");
  const [year, setYear] = useState("");
  const [summary, setSummary] = useState("");
  const [tableOfContents, setTableOfContents] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [region, setRegion] = useState(null); // Estado para la región seleccionada
  const [message, setMessage] = useState("");

  /**
   * Aplana la jerarquía de regiones en un formato adecuado para react-select
   */
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

  /**
   * Función para cargar las regiones desde la API
   */
  const loadRegions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await fetch(`/api/regions?search=${inputValue}`);
      const data = await response.json();

      // Aplanar la jerarquía para react-select
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
    if (!year || isNaN(parseInt(year, 10))) {
      setMessage("Por favor, selecciona un año válido.");
      return;
    }

    const formData = new FormData();
    formData.append("number", number);
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("datePublished", datePublished);
    formData.append("year", parseInt(year, 10));
    formData.append("summary", summary);
    formData.append("tableOfContents", tableOfContents);
    formData.append("isCurrent", isCurrent);
    formData.append("coverImage", coverImage);
    formData.append("backgroundImage", backgroundImage);

    // Agregamos la región seleccionada al formulario
    if (region) {
      formData.append("regionId", region.value);
    }

    try {
      const res = await fetch("/api/editions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessage("Edición creada con éxito.");
        console.log("Edición creada con éxito:", data);
        alert("Edición creada con éxito.");
      } else {
        const errorText = await res.text();
        setMessage(`Error al crear la edición: ${errorText}`);
        console.error("Error al crear la edición:", errorText);
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
        <InputField
          id="datePublished"
          label="Fecha de Publicación"
          type="date"
          value={datePublished}
          onChange={(e) => setDatePublished(e.target.value)}
        />
        <div className={styles.formGroup}>
          <label htmlFor="year" className={styles.formLabel}>
            Año
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">Seleccione un año</option>
            {Array.from({ length: 2025 - 1991 + 1 }, (_, i) => 1991 + i).map(
              (yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              )
            )}
          </select>
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
