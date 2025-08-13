"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic"; // Importación dinámica
import InputField from "../../../components/Articles/NewArticle/InputField";
import TextAreaField from "../../../components/Articles/NewArticle/TextAreaField";
import ToggleSwitch from "../../../components/Articles/NewArticle/ToggleSwitch";
import SubmitButton from "../../../components/Articles/NewArticle/SubmitButton";
import FormMessage from "../../../components/Articles/NewArticle/FormMessage";
import AsyncSelect from "react-select/async"; // Importamos AsyncSelect
import "react-datepicker/dist/react-datepicker.css"; // Estilos de react-datepicker
import styles from "../../../../styles/global.module.css";
import { useTranslations } from "next-intl";

const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);

// Importación dinámica del DatePicker
const DatePicker = dynamic(
  () => import("react-datepicker").then((mod) => mod.default),
  { ssr: false }
);

export default function NewEditionForm() {
  const t = useTranslations("insertDossier");
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [isAvailableToOrder, setIsAvailableToOrder] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [datePublished, setDatePublished] = useState(null);
  const [summary, setSummary] = useState("");
  const [resetTrigger, setResetTrigger] = useState(false);
  const [tableOfContents, setTableOfContents] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [regions, setRegions] = useState([]); // Cambia el estado a un array
  const [topics, setTopics] = useState([]); // Cambia el estado a un array
  const coverImageRef = useRef(null); // Crea una referencia para el input de archivo
  const backgroundImageRef = useRef(null); // Crea una referencia para el input de archivo

  const [message, setMessage] = useState("");

  // Maneja los Temas del articulo
  const flattenTopics = (topics, parentName = "") => {
    const options = [];

    topics.forEach((topic) => {
      const label = parentName ? `${parentName} > ${topic.name}` : topic.name;

      options.push({
        value: topic.id,
        label,
      });

      if (topic.children && topic.children.length > 0) {
        options.push(...flattenTopics(topic.children, label));
      }
    });

    return options;
  };

  const loadTopics = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await fetch(`/api/topics?search=${inputValue}`);
      const data = await response.json();

      const flattenedTopics = flattenTopics(data);

      // Agrega la opción "Crear tema"
      return [
        { value: "new", label: `Crear tema: "${inputValue}"` },
        ...flattenedTopics,
      ];
    } catch (error) {
      console.error("Error al cargar los temas:", error);
      return [];
    }
  };
  const handleTopicChange = async (selectedOptions) => {
    const lastOption = selectedOptions[selectedOptions.length - 1];

    if (lastOption?.value === "new") {
      const newTopic = await createNewTopic(
        lastOption.label.replace('Crear tema: "', "").replace('"', "")
      );

      if (newTopic) {
        setTopics((prev) => [...prev, newTopic]);
      }
    } else {
      setTopics(selectedOptions || []);
    }
  };

  const createNewTopic = async (inputValue) => {
    // Verificar si el tema ya existe
    const exists = topics.some(
      (topic) => topic.label.toLowerCase() === inputValue.toLowerCase()
    );

    if (exists) {
      setMessage(`El tema "${inputValue}" ya existe.`);
      return null;
    }

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputValue }),
      });

      if (response.ok) {
        const newTopic = await response.json();
        setMessage(`Tema "${newTopic.name}" creado exitosamente.`);
        return { value: newTopic.id, label: newTopic.name };
      } else {
        setMessage("Error al crear el tema.");
        return null;
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      setMessage("Error al conectar con el servidor.");
      return null;
    }
  };
  ///////////////////////

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
    const regionIds = regions.map((region) => region.value);
    const topicIds = topics.map((topic) => topic.value);

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
    formData.append("regions", JSON.stringify(regionIds));
    formData.append("topics", JSON.stringify(topicIds));

    try {
      const res = await fetch("/api/editions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("Edición creada con éxito.");
        alert("Edición creada con éxito.");
        setNumber("");
        setTitle("");
        setSubtitle("");
        setIsAvailableToOrder(false);
        setDatePublished(null);
        setSummary("");
        setResetTrigger((prev) => !prev);
        setTableOfContents("");
        setIsCurrent(false);
        setCoverImage(null);
        setBackgroundImage(null);
        setRegions([]);
        setTopics([]);
      } else {
        const errorText = await res.text();
        setMessage(`Error al crear la edición: ${errorText}`);
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Error al enviar los datos.");
    }
    if (coverImageRef.current) {
      coverImageRef.current.value = ""; // Resetea el valor del input file
    }
    if (backgroundImageRef.current) {
      backgroundImageRef.current.value = ""; // Resetea el valor del input file
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.formTitle}>{t("formTitle")}</h1>
      {message && <FormMessage message={message} />}
      <form onSubmit={handleSubmit} className={styles.form}>
        <InputField
          id="number"
          label={t("numberLabel")}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={t("numberPh")}
          required
        />
        <InputField
          id="title"
          label={t("titleLabel")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePh")}
          required
        />
        <InputField
          id="subtitle"
          label={t("subtitleLabel")}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder={t("subtitlePh")}
        />
        <div className={styles.formGroup}>
          <label htmlFor="datePublished" className={styles.formLabel}>
            {t("dateLabel")}
          </label>
          <DatePicker
            selected={datePublished}
            onChange={(date) => setDatePublished(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className={styles.input}
            placeholderText={t("datePh")}
          />
        </div>
        {/* <QuillEditor onChange={handleSaveSummary} /> */}
        {/* Editorial */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t("editorialLabel")}</label>

          <QuillEditor
            value={summary}
            onChange={(newSummary) => setSummary(newSummary)}
            resetTrigger={resetTrigger}
            // si tu QuillEditor acepta placeholder, puedes pasar uno:
            // placeholder={t("editorialPlaceholder")}
          />
        </div>
        <TextAreaField
          id="tableOfContents"
          label={t("tocLabel")}
          value={tableOfContents}
          onChange={(e) => setTableOfContents(e.target.value)}
          placeholder={t("tocPh")}
        />
        <ToggleSwitch
          id="isCurrent"
          label={t("isCurrent")}
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
        />
        <ToggleSwitch
          id="isAvailableToOrder"
          label={t("isAvailable")}
          checked={isAvailableToOrder}
          onChange={(e) => setIsAvailableToOrder(e.target.checked)}
        />
        <div className={styles.formGroup}>
          <label htmlFor="topic" className={styles.formLabel}>
            {t("topicsLabel")}
          </label>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadTopics}
            onChange={handleTopicChange}
            value={topics} // Temas seleccionados
            placeholder={t("topicsPh")}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="region" className={styles.formLabel}>
            {t("regionsLabel")}
          </label>
          <AsyncSelect
            isMulti // Permitir selección múltiple
            cacheOptions
            defaultOptions
            loadOptions={loadRegions}
            onChange={(selectedOptions) => setRegions(selectedOptions || [])} // Actualizar el array de regiones
            value={regions} // Mostrar las regiones seleccionadas
            placeholder={t("regionsPh")}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="coverImage" className={styles.formLabel}>
            {t("coverLabel")}
          </label>
          <input
            type="file"
            id="coverImage"
            ref={coverImageRef}
            onChange={(e) => setCoverImage(e.target.files[0])}
            className={styles.input}
            required
          />
        </div>

        <SubmitButton label={t("submit")} />
      </form>
    </div>
  );
}
