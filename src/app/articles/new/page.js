"use client";

import { useState, useEffect, useRef } from "react";
import InputField from "../../components/InputField";

import SelectField from "../../components/SelectField";
import ToggleSwitch from "../../components/ToggleSwitch";
import FormMessage from "../../components/FormMessage";
import SubmitButton from "../../components/SubmitButton";
import Modal from "../../components/Modal";
import styles from "../../styles/global.module.css";
import CheckboxField from "../../components/CheckboxField";
import AsyncSelect from "react-select/async";
import dynamic from "next/dynamic";
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor/QuillEditor"),
  {
    ssr: false,
  }
);

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [resetTrigger, setResetTrigger] = useState(false);

  const [articleImage, setArticleImage] = useState(null); // Manejar la imagen del artículo

  const [beitragstypen, setBeitragstypen] = useState([]);
  const [selectedBeitragstyp, setSelectedBeitragstyp] = useState("");
  const [subtypen, setSubtypen] = useState([]);
  const [selectedSubtyp, setSelectedSubtyp] = useState("");
  const [isPrinted, setIsPrinted] = useState(false);
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [message, setMessage] = useState("");
  const [authors, setAuthors] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorEmail, setNewAuthorEmail] = useState("");
  const [isInterview, setIsInterview] = useState(false); // Toggle para entrevistas
  const [interviewees, setInterviewees] = useState([]); // Lista de entrevistados
  const [selectedInterviewee, setSelectedInterviewee] = useState(""); // Entrevistado seleccionado
  const [isIntervieweeModalOpen, setIsIntervieweeModalOpen] = useState(false);
  const [newIntervieweeName, setNewIntervieweeName] = useState("");
  const [isPublished, setIsPublished] = useState(false); // Toggle para "Publicar Ahora"
  const [schedulePublish, setSchedulePublish] = useState(false); // Toggle para "Programar Publicación"
  const [publicationDate, setPublicationDate] = useState(null); // Fecha programada
  const [deceasedFirstName, setDeceasedFirstName] = useState("");
  const [deceasedLastName, setDeceasedLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");

  const [previewTextEnabled, setPreviewTextEnabled] = useState(false); // Toggle para habilitarlo
  const [previewText, setPreviewText] = useState(""); // Texto opcional
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [additionalInfoEnabled, setAdditionalInfoEnabled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [regions, setRegions] = useState([]); // Cambia el estado a un array
  const [topics, setTopics] = useState([]); // Cambia el estado a un array
  const [bookImage, setBookImage] = useState(null); // Imagen del libro
  const [mediaTitle, setMediaTitle] = useState(""); // Título completo del libro

  const fileInputRef = useRef(null); // Crea una referencia para el input de archivo

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

  // Maneja las Regiones del aritulo
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

  const isNachruf =
    beitragstypen.find((typ) => typ.id === parseInt(selectedBeitragstyp, 10))
      ?.name === "Nachruf";

  // Fetch Beitragstypen
  useEffect(() => {
    const fetchBeitragstypen = async () => {
      try {
        const res = await fetch("/api/beitragstypen");
        if (res.ok) {
          const data = await res.json();
          setBeitragstypen(data);
        } else {
          setMessage("Error al cargar los tipos de artículo.");
        }
      } catch {
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchBeitragstypen();
  }, []);

  // Fetch de categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data); // Guardar las categorías
        } else {
          console.error("Error al cargar categorías");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Authors
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch("/api/authors");
        if (res.ok) {
          const data = await res.json();
          setAuthors(data);
        } else {
          setMessage("Error al cargar los autores.");
        }
      } catch {
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchAuthors();
  }, []);

  // Fetch Interviewees
  useEffect(() => {
    const fetchInterviewees = async () => {
      try {
        const res = await fetch("/api/interviewees");
        if (res.ok) {
          const data = await res.json();
          setInterviewees(data);
        } else {
          setMessage("Error al cargar los entrevistados.");
        }
      } catch {
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchInterviewees();
  }, []);

  // Update subtypes based on selected beitragstyp
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
  const isBuchBesprechung =
    beitragstypen.length > 0 &&
    beitragstypen.find((typ) => typ.id === parseInt(selectedBeitragstyp, 10))
      ?.name === "Buchbesprechung";

  // Fetch Editions
  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const res = await fetch("/api/editions");
        if (res.ok) {
          const data = await res.json();
          setEditions(data);
        } else {
          setMessage("Error al cargar las ediciones.");
        }
      } catch {
        setMessage("Error al conectar con el servidor.");
      }
    };

    fetchEditions();
  }, []);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data); // Aquí simplemente guardamos los datos
      } catch (error) {
        console.error("Error al cargar las categorías:", error);
      }
    };

    fetchCategories();
  }, []);

  // Manejar selección de categorías
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(
      (prevSelected) =>
        prevSelected.includes(categoryId)
          ? prevSelected.filter((id) => id !== categoryId) // Eliminar si está seleccionado
          : [...prevSelected, categoryId] // Agregar si no está seleccionado
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Crear una instancia de FormData
    const formData = new FormData();

    // Agregar campos básicos
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("content", content);
    //Manejo de Imagen de articulo
    if (articleImage) {
      formData.append("articleImage", articleImage);
    }

    // Manejo de Autores
    formData.append("authorId", selectedAuthor || null);
    // Manejo de regiones y temas como JSON
    formData.append(
      "regions",
      JSON.stringify(regions.map((region) => region.value))
    );
    formData.append(
      "topics",
      JSON.stringify(topics.map((topic) => topic.value))
    );

    // Agregar otros campos, verificando si están habilitados o tienen datos
    formData.append("beitragstypId", selectedBeitragstyp);
    formData.append("beitragssubtypId", selectedSubtyp || null);

    if (isPrinted) {
      formData.append("isPrinted", isPrinted);
      formData.append("editionId", selectedEdition);
      formData.append("startPage", startPage);
      formData.append("endPage", endPage);
    }
    if (isBuchBesprechung) {
      formData.append("bookImage", bookImage);
      formData.append("mediaTitle", mediaTitle);
    }

    if (isInterview) {
      formData.append("isInterview", isInterview);
      formData.append("intervieweeId", selectedInterviewee);
    }

    if (isNachruf) {
      formData.append("deceasedFirstName", deceasedFirstName);
      formData.append("deceasedLastName", deceasedLastName);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("dateOfDeath", dateOfDeath);
    }

    if (previewTextEnabled) {
      formData.append("previewText", previewText);
    }

    if (additionalInfoEnabled) {
      formData.append("additionalInfo", additionalInfo);
    }

    formData.append("isPublished", isPublished);
    formData.append("schedulePublish", schedulePublish);
    if (schedulePublish) {
      formData.append("publicationDate", publicationDate.toISOString());
    }

    // Agregar categorías seleccionadas
    formData.append("categories", JSON.stringify(selectedCategories));

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        body: formData, // Aquí pasamos el FormData
      });

      if (res.ok) {
        setMessage("Artículo creado con éxito.");
        resetForm();
      } else {
        const errorText = await res.text();
        setMessage(`Error al crear el artículo: ${errorText}`);
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      setMessage("Error al enviar los datos.");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Resetea el valor del input file
    }
  };
  // Función para reiniciar el formulario
  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setContent("");

    setResetTrigger((prev) => !prev); // Reset temporal para permitir reutilización

    setSelectedBeitragstyp("");
    setSelectedSubtyp("");
    setIsPrinted(false);
    setSelectedEdition("");
    setStartPage("");
    setEndPage("");
    setSelectedAuthor("");
    setSelectedInterviewee("");
    setIsInterview(false);
    setDeceasedFirstName("");
    setDeceasedLastName("");
    setDateOfBirth("");
    setDateOfDeath("");
    setPreviewTextEnabled(false);
    setPreviewText("");
    setIsPublished(false);
    setSchedulePublish(false);
    setAdditionalInfo("");
    setAdditionalInfoEnabled(false);
    setSelectedCategories([]);
    setRegions([]);
    setTopics([]);
    setArticleImage(null);
    setMediaTitle("");
    setBookImage(null);
  };

  const handleAddAuthor = async () => {
    if (!newAuthorName) {
      setMessage("El nombre del autor es obligatorio.");
      return;
    }

    try {
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAuthorName.trim(),
          email: newAuthorEmail?.trim() || null,
        }),
      });

      if (res.ok) {
        const newAuthor = await res.json();

        if (!newAuthor || !newAuthor.id) {
          setMessage("Error inesperado: no se recibió un ID de autor.");
          return;
        }

        setAuthors((prev) => [
          ...prev,
          { id: newAuthor.id, name: newAuthor.name },
        ]);
        setSelectedAuthor(newAuthor.id);
        setMessage("Autor agregado con éxito.");
        setIsModalOpen(false);
        setNewAuthorName("");
        setNewAuthorEmail("");
      } else {
        let errorMessage = "Error desconocido.";
        const contentType = res.headers.get("content-type");

        // Solo intentar parsear JSON si el tipo de contenido es JSON
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await res.json();
            errorMessage = errorData?.error || errorMessage;
          } catch (jsonError) {
            console.error("Error al parsear la respuesta JSON:", jsonError);
          }
        } else {
          errorMessage = `Error con código ${res.status}: ${res.statusText}`;
        }

        setMessage(`Error al agregar el autor: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      setMessage("Error al conectar con el servidor.");
    }
  };

  const handleAddInterviewee = async () => {
    if (!newIntervieweeName) {
      setMessage("El nombre del entrevistado es obligatorio.");
      return;
    }

    try {
      const res = await fetch("/api/interviewees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newIntervieweeName }),
      });

      if (res.ok) {
        const newInterviewee = await res.json();
        setInterviewees((prev) => [...prev, newInterviewee]);
        setSelectedInterviewee(newInterviewee.id);
        setMessage("Entrevistado agregado con éxito.");
        setIsIntervieweeModalOpen(false);
        setNewIntervieweeName("");
      } else {
        setMessage("Error al agregar el entrevistado.");
      }
    } catch {
      setMessage("Error al conectar con el servidor.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.formTitle}>Crear un nuevo artículo</h1>
      {message && <FormMessage message={message} />}
      <form onSubmit={handleSubmit} className={styles.form}>
        <InputField
          id="title"
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ingrese el título"
        />
        <InputField
          id="subtitle"
          label="Subtítulo"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Ingrese el subtítulo"
        />
        <ToggleSwitch
          id="enablePreviewText"
          label="¿Agregar texto de vista previa?"
          checked={previewTextEnabled}
          onChange={(e) => {
            const isEnabled = e.target.checked;
            setPreviewTextEnabled(isEnabled);
            if (!isEnabled) {
              setPreviewText(""); // Limpia el texto cuando se desactiva
            }
          }}
        />

        {previewTextEnabled && (
          <div key={previewTextEnabled ? "editor-enabled" : "editor-disabled"}>
            <QuillEditor
              onChange={(value) => setPreviewText(value)} // Actualiza el contenido
              resetTrigger={resetTrigger} // Reinicia el editor
            />
          </div>
        )}
        <div>
          <h3>Categorías</h3>
          {categories.map((category) => (
            <CheckboxField
              key={category.id}
              id={`category-${category.id}`}
              label={category.name}
              checked={selectedCategories.includes(category.id)}
              onChange={() => handleCategoryChange(category.id)}
            />
          ))}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="region" className={styles.formLabel}>
            Región/es:
          </label>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadRegions}
            onChange={(selectedOptions) => setRegions(selectedOptions || [])}
            value={regions}
            placeholder="Escriba para buscar regiones"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="topic" className={styles.formLabel}>
            Tema/s:
          </label>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadTopics}
            onChange={handleTopicChange}
            value={topics} // Temas seleccionados
            placeholder="Escriba para buscar o agregar temas"
          />
        </div>
        <QuillEditor
          onChange={(value) => setContent(value)} // Actualiza el contenido
          resetTrigger={resetTrigger} // Reinicia el editor
        />
        <div className={styles.formGroup}>
          <label htmlFor="articleImage" className={styles.formLabel}>
            Imagen del Artículo (opcional):
          </label>
          <input
            type="file"
            id="articleImage"
            ref={fileInputRef}
            onChange={(e) => setArticleImage(e.target.files[0])} // Guarda la imagen en el estado
            className={styles.input}
            accept="image/*"
          />
        </div>
        <ToggleSwitch
          id="additionalInfoToggle"
          label="¿Agregar Información Adicional?"
          checked={additionalInfoEnabled}
          onChange={(e) => setAdditionalInfoEnabled(e.target.checked)}
        />
        {additionalInfoEnabled && (
          <InputField
            id="additionalInfo"
            label="Información Adicional"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Ingrese información adicional"
          />
        )}

        <SelectField
          id="beitragstyp"
          label="Tipo de Artículo"
          options={beitragstypen}
          value={selectedBeitragstyp}
          onChange={(e) => setSelectedBeitragstyp(e.target.value)}
          placeholder="Seleccione un tipo"
        />
        {isBuchBesprechung && (
          <div>
            <h3>Detalles del Libro</h3>
            <InputField
              id="mediaTitle"
              label="Título del libro"
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              placeholder="Ingrese el título completo del libro"
            />
            <div className={styles.formGroup}>
              <label htmlFor="bookImage" className={styles.formLabel}>
                Imagen del libro
              </label>
              <input
                type="file"
                id="bookImage"
                accept="image/*"
                onChange={(e) => setBookImage(e.target.files[0])} // Actualiza el estado con el archivo
              />
            </div>
          </div>
        )}

        {isNachruf && (
          <div>
            <h3>Detalles de la necrología</h3>
            <InputField
              id="deceasedFirstName"
              label="Primer Nombre"
              value={deceasedFirstName}
              onChange={(e) => setDeceasedFirstName(e.target.value)}
              placeholder="Ingrese el primer nombre"
            />
            <InputField
              id="deceasedLastName"
              label="Apellido"
              value={deceasedLastName}
              onChange={(e) => setDeceasedLastName(e.target.value)}
              placeholder="Ingrese el apellido"
            />
            <InputField
              id="dateOfBirth"
              label="Año de Nacimiento"
              value={dateOfBirth || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setDateOfBirth(value); // Permite solo hasta 4 dígitos
                }
              }}
              placeholder="Ingrese el año (ejemplo: 1990)"
            />
            <InputField
              id="dateOfDeath"
              label="Año de Defunción"
              value={dateOfDeath || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setDateOfDeath(value); // Permite solo hasta 4 dígitos
                }
              }}
              placeholder="Ingrese el año (ejemplo: 2020)"
            />
          </div>
        )}
        {subtypen.length > 0 && (
          <SelectField
            id="subtyp"
            label="Subtipo de Artículo"
            options={subtypen}
            value={selectedSubtyp}
            onChange={(e) => setSelectedSubtyp(e.target.value)}
            placeholder="Seleccione un subtipo"
          />
        )}

        <div className={styles.authorSection}>
          <SelectField
            id="author"
            label="Autor"
            options={authors}
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            placeholder="Seleccione un autor"
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={styles.addAuthorButton}
          >
            ¿Es un autor nuevo?
          </button>
        </div>
        <ToggleSwitch
          id="isInterview"
          label="¿Es una entrevista?"
          checked={isInterview}
          onChange={(e) => setIsInterview(e.target.checked)}
        />
        {isInterview && (
          <>
            <SelectField
              id="interviewee"
              label="Entrevistado"
              options={interviewees.map((int) => ({
                id: int.id,
                name: int.name,
              }))}
              value={selectedInterviewee}
              onChange={(e) => setSelectedInterviewee(e.target.value)}
              placeholder="Seleccione un entrevistado"
            />
            <button
              type="button"
              onClick={() => setIsIntervieweeModalOpen(true)}
              className={styles.addAuthorButton}
            >
              ¿Es un entrevistado nuevo?
            </button>
          </>
        )}
        <ToggleSwitch
          id="isPrinted"
          label="¿Está en la versión impresa?"
          checked={isPrinted}
          onChange={(e) => setIsPrinted(e.target.checked)}
        />
        {isPrinted && (
          <>
            <SelectField
              id="edition"
              label="Edición de la revista"
              options={editions.map((edition) => ({
                id: edition.id,
                name: `${edition.number} - ${edition.title}`,
              }))}
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              placeholder="Seleccione una edición"
            />
            <InputField
              id="startPage"
              label="Página de inicio"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              placeholder="Página de inicio"
            />
            <InputField
              id="endPage"
              label="Página de fin"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="Página de fin"
            />
          </>
        )}
        <ToggleSwitch
          id="isPublished"
          label="Publicar Ahora"
          checked={isPublished}
          onChange={(e) => {
            setIsPublished(e.target.checked);
            if (e.target.checked) setSchedulePublish(false); // Desactiva programar publicación si está activo
          }}
        />

        <ToggleSwitch
          id="schedulePublish"
          label="Programar Publicación"
          checked={schedulePublish}
          onChange={(e) => {
            setSchedulePublish(e.target.checked);
            if (e.target.checked) setIsPublished(false); // Desactiva "Publicar ahora" si está activo
          }}
        />

        {schedulePublish && (
          <div>
            <label>Fecha de Publicación</label>
            <input
              type="datetime-local"
              value={
                publicationDate
                  ? publicationDate.toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => setPublicationDate(new Date(e.target.value))}
            />
          </div>
        )}
        <SubmitButton label="Crear artículo" />
      </form>
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2>Agregar Nuevo Autor</h2>
          <InputField
            id="newAuthorName"
            label="Nombre del Autor"
            value={newAuthorName}
            onChange={(e) => setNewAuthorName(e.target.value)}
            placeholder="Ingrese el nombre del autor"
          />
          <InputField
            id="newAuthorEmail"
            label="Email del Autor (opcional)"
            value={newAuthorEmail}
            onChange={(e) => setNewAuthorEmail(e.target.value)}
            placeholder="Ingrese el email del autor"
          />
          <button onClick={handleAddAuthor} className={styles.addAuthorButton}>
            Agregar Autor
          </button>
        </Modal>
      )}
      {isIntervieweeModalOpen && (
        <Modal onClose={() => setIsIntervieweeModalOpen(false)}>
          <h2>Agregar Nuevo Entrevistado</h2>
          <InputField
            id="newIntervieweeName"
            label="Nombre del Entrevistado"
            value={newIntervieweeName}
            onChange={(e) => setNewIntervieweeName(e.target.value)}
            placeholder="Ingrese el nombre del entrevistado"
          />
          <button
            onClick={handleAddInterviewee}
            className={styles.addAuthorButton}
          >
            Agregar Entrevistado
          </button>
        </Modal>
      )}
    </div>
  );
}
