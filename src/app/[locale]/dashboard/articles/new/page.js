"use client";

import { useState, useEffect, useRef } from "react";
import InputField from "../../../components/Articles/NewArticle/InputField";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

import SelectField from "../../../components/Articles/NewArticle/SelectField";
import ToggleSwitch from "../../../components/Articles/NewArticle/ToggleSwitch";
import FormMessage from "../../../components/Articles/NewArticle/FormMessage";
import SubmitButton from "../../../components/Articles/NewArticle/SubmitButton";
import Modal from "../../../components/Articles/NewArticle/Modal";
import styles from "../../../../styles/global.module.css";
import CheckboxField from "../../../components/Articles/NewArticle/CheckboxField";
import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";

import dynamic from "next/dynamic";
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  {
    ssr: false,
  }
);

export default function NewArticlePage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [resetTrigger, setResetTrigger] = useState(false);
  const t = useTranslations("newArticle.form");
  const locale = useLocale();

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
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedInterviewees, setSelectedInterviewees] = useState([]); // ✅ igual que en Edit
  const [isIntervieweeModalOpen, setIsIntervieweeModalOpen] = useState(false);
  const [newIntervieweeName, setNewIntervieweeName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorEmail, setNewAuthorEmail] = useState("");
  const [isInterview, setIsInterview] = useState(false); // Toggle para entrevistas

  const [publicationDate, setPublicationDate] = useState(null); // Fecha programada

  const [useCustomDate, setUseCustomDate] = useState(false);
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

  // Galería de imágenes adicionales (opcional)
  const [gallery, setGallery] = useState([]); // cada item: { file, title, alt, isCover, order }

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

  // 👇 sustituye tu loadTopics por este
  const loadTopics = async (inputValue) => {
    const q = (inputValue || "").trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/topics?search=${encodeURIComponent(q)}`);
      const data = await res.json();

      const flat = flattenTopics(data); // [{ value, label }, ...]
      const norm = (s) => (s || "").trim().toLowerCase();
      const nq = norm(q);

      // prioridad: exacto → empieza con → contiene
      const exact = flat.filter((o) => norm(o.label) === nq);
      const starts = flat.filter(
        (o) => norm(o.label).startsWith(nq) && norm(o.label) !== nq
      );
      const includes = flat.filter(
        (o) => norm(o.label).includes(nq) && !norm(o.label).startsWith(nq)
      );

      const ordered = [...exact, ...starts, ...includes];

      // Solo mostrar "Crear tema" si NO hay match exacto
      const maybeCreate =
        exact.length === 0
          ? [
              {
                value: "new",
                label: `${t("createTopicPrefix")}: "${q}"`,
                __inputValue: q, // 👈 clave para NO romper tu handleTopicChange
              },
            ]
          : [];

      return [...maybeCreate, ...ordered];
    } catch (error) {
      console.error("Error al cargar los temas:", error);
      return [];
    }
  };
  const loadInterviewees = async (inputValue) => {
    try {
      const res = await fetch("/api/interviewees");
      if (!res.ok) return [];

      const data = await res.json();

      const filtered = data.filter((int) =>
        int.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      return filtered.map((int) => ({
        value: int.id,
        label: int.name,
      }));
    } catch (error) {
      console.error("Error cargando entrevistados:", error);
      return [];
    }
  };

  // ⬇️ AQUI INSERTA LA NUEVA FUNCIÓN
  const loadAuthors = async (inputValue) => {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) return [];

      const data = await res.json();

      const filtered = data.filter((a) =>
        a.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      return filtered.map((a) => ({
        value: a.id,
        label: a.name,
      }));
    } catch (error) {
      console.error("Error cargando autores:", error);
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
      const rawName = lastOption.__inputValue || lastOption.label;
      const newTopic = await createNewTopic(rawName);

      if (newTopic) {
        // reemplaza la última opción "new" por el tema creado
        setTopics([...selectedOptions.slice(0, -1), newTopic]);
      }
    } else {
      setTopics(selectedOptions || []);
    }
  };

  const createNewTopic = async (inputValue) => {
    // Verificar si el tema ya existe (normalizado)
    const norm = (s) => s?.trim().toLowerCase();
    const exists = topics.some((t) => norm(t.label) === norm(inputValue));

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
    const q = (inputValue || "").trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/regions?search=${encodeURIComponent(q)}`);
      const data = await res.json();

      const flat = flattenRegions(data); // [{ value, label }, ...]
      const norm = (s) => (s || "").trim().toLowerCase();
      const nq = norm(q);

      // prioridad: exacto → empieza con → contiene
      const exact = flat.filter((o) => norm(o.label) === nq);
      const starts = flat.filter(
        (o) => norm(o.label).startsWith(nq) && norm(o.label) !== nq
      );
      const includes = flat.filter(
        (o) => norm(o.label).includes(nq) && !norm(o.label).startsWith(nq)
      );

      const ordered = [...exact, ...starts, ...includes];

      // Solo mostrar "Crear región" si NO hay match exacto
      const maybeCreate =
        exact.length === 0
          ? [
              {
                value: "new",
                label: `${t("createRegionPrefix") || "Región erstellen"}: "${q}"`,
                __inputValue: q,
              },
            ]
          : [];

      return [...maybeCreate, ...ordered];
    } catch (error) {
      console.error("Error al cargar regiones:", error);
      return [];
    }
  };
  // ⬇️ AQUI PEGAS ESTA FUNCIÓN
  const handleRegionChange = async (selectedOptions) => {
    const lastOption = selectedOptions[selectedOptions.length - 1];

    if (lastOption?.value === "new") {
      const rawName = lastOption.__inputValue || lastOption.label;
      const newRegion = await createNewRegion(rawName);

      if (newRegion) {
        setRegions([...selectedOptions.slice(0, -1), newRegion]);
      }
    } else {
      setRegions(selectedOptions || []);
    }
  };

  const createNewRegion = async (inputValue) => {
    // Verificar si ya existe (normalizado)
    const norm = (s) => s?.trim().toLowerCase();
    const exists = regions.some((r) => norm(r.label) === norm(inputValue));

    if (exists) {
      setMessage(`La región "${inputValue}" ya existe.`);
      return null;
    }

    try {
      const response = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputValue }),
      });

      if (response.ok) {
        const newRegion = await response.json();

        // 👇 devuelve en el mismo formato que AsyncSelect espera
        const option = { value: newRegion.id, label: newRegion.name };

        setMessage(`Región "${newRegion.name}" creada exitosamente.`);
        return option;
      } else {
        setMessage("Error al crear la región.");
        return null;
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      setMessage("Error al conectar con el servidor.");
      return null;
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
  // Auto-marcar "Nur Online / Solo en Línea" desde el inicio
  useEffect(() => {
    const soloEnLinea = categories.find(
      (c) =>
        c.name === "Nur Online" ||
        c.name === "Solo en Línea" || // con acento
        c.nameES === "Solo en Línea" // con acento
    );

    if (soloEnLinea && !isPrinted && !selectedEdition) {
      setSelectedCategories((prev) =>
        prev.includes(soloEnLinea.id) ? prev : [...prev, soloEnLinea.id]
      );
    }

    if (isPrinted && soloEnLinea) {
      setSelectedCategories((prev) =>
        prev.filter((id) => id !== soloEnLinea.id)
      );
    }
  }, [categories, isPrinted, selectedEdition]);
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

  // Update subtypes based on selected beitragstyp
  useEffect(() => {
    if (selectedBeitragstyp) {
      const selected = beitragstypen.find(
        (typ) => typ.id === parseInt(selectedBeitragstyp, 10)
      );

      setSubtypen(selected?.subtypes || []);

      // 👇 aquí forzamos el toggle si es entrevista
      if (selected?.name === "Interview") {
        setIsInterview(true);
      } else {
        setIsInterview(false);
      }
    } else {
      setSubtypen([]);
      setIsInterview(false);
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

          // Ordenar de mayor a menor por número
          const sorted = data.sort((a, b) => b.number - a.number);

          setEditions(sorted);
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
  // 5. Opciones localizadas
  const beitragstypOptions = beitragstypen.map((typ) => ({
    id: typ.id,
    name: locale === "es" && typ.nameES ? typ.nameES : typ.name,
  }));

  const subtypOptions = subtypen.map((s) => ({
    id: s.id,
    name: locale === "es" && s.nameES ? s.nameES : s.name,
  }));

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
    // 🔽 Agregar todas las imágenes de la galería
    gallery.forEach((img, idx) => {
      if (img.file) formData.append(`gallery[${idx}][file]`, img.file);
      formData.append(`gallery[${idx}][title]`, img.title || "");
      formData.append(`gallery[${idx}][alt]`, img.alt || "");
      formData.append(
        `gallery[${idx}][isCover]`,
        img.isCover ? "true" : "false"
      );
    });
    if (session?.user?.id) {
      formData.append("userId", session.user.id);
    }

    // Manejo de Autores
    formData.append(
      "authors",
      JSON.stringify(selectedAuthors.map((a) => a.value))
    );
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
      formData.append(
        "interviewees",
        JSON.stringify(selectedInterviewees.map((i) => i.value))
      );
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

    // 📅 Publicación automática
    let finalDate = publicationDate;
    let finalIsPublished = true;

    if (!useCustomDate) {
      finalDate = new Date(); // se publica ahora
      finalIsPublished = true;
    } else if (publicationDate) {
      // si la fecha es pasada o hoy => publicado
      finalIsPublished = new Date(publicationDate) <= new Date();
    }

    // ⚡ convertir fecha local a UTC correctamente
    if (finalDate) {
      const utcDate = new Date(
        finalDate.getTime() - finalDate.getTimezoneOffset() * 60000
      );
      formData.append("publicationDate", utcDate.toISOString());
    } else {
      formData.append("publicationDate", new Date().toISOString());
    }

    formData.append("isPublished", finalIsPublished);

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
    setSelectedAuthors([]);
    setSelectedInterviewees([]);
    setIsInterview(false);
    setDeceasedFirstName("");
    setDeceasedLastName("");
    setDateOfBirth("");
    setDateOfDeath("");
    setPreviewTextEnabled(false);
    setPreviewText("");

    setUseCustomDate(false);
    setPublicationDate(null);
    setAdditionalInfo("");
    setAdditionalInfoEnabled(false);
    setSelectedCategories([]);
    setRegions([]);
    setTopics([]);

    setMediaTitle("");
    setBookImage(null);

    setGallery([]); // 🔽 limpia la galería de imágenes
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

        // ✅ Actualiza la lista de autores disponibles
        setAuthors((prev) => [
          ...prev,
          { id: newAuthor.id, name: newAuthor.name },
        ]);

        // ✅ Selecciona automáticamente el nuevo autor en el form
        setSelectedAuthors((prev) => [
          ...prev,
          { value: newAuthor.id, label: newAuthor.name },
        ]);

        setMessage("Autor agregado con éxito.");
        setIsModalOpen(false);
        setNewAuthorName("");
        setNewAuthorEmail("");
      } else {
        let errorMessage = "Error desconocido.";
        const contentType = res.headers.get("content-type");

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
        setSelectedInterviewees((prev) => [
          ...prev,
          { value: newInterviewee.id, label: newInterviewee.name },
        ]);
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
      <h1 className={styles.formTitle}>{t("formTitle")}</h1>
      {message && <FormMessage message={message} />}
      <form onSubmit={handleSubmit} className={styles.form}>
        <InputField
          id="title"
          label={t("title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
        />
        <InputField
          id="subtitle"
          label={t("subtitle")}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder={t("subtitlePlaceholder")}
        />

        <ToggleSwitch
          id="enablePreviewText"
          label={t("previewToggle")} //Agregar Texto de vista previa
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
        <ToggleSwitch
          id="isPrinted"
          label={t("printedToggle")}
          checked={isPrinted}
          onChange={(e) => setIsPrinted(e.target.checked)}
        />

        {isPrinted && (
          <>
            <SelectField
              id="edition"
              label={t("edition")}
              options={editions.map((edition) => ({
                id: edition.id,
                name: `${edition.number} - ${edition.title}`,
              }))}
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              placeholder={t("editionPlaceholder")}
            />
            <InputField
              id="startPage"
              label={t("startPage")}
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              placeholder={t("startPagePlaceholder")}
            />
            <InputField
              id="endPage"
              label={t("endPage")}
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder={t("endPagePlaceholder")}
            />
          </>
        )}
        <div>
          <h3>{t("categoryLabel")}</h3>
          {categories.map((category) => (
            <CheckboxField
              key={category.id}
              id={`category-${category.id}`}
              label={
                locale === "es" && category.nameES
                  ? category.nameES
                  : category.name
              }
              checked={selectedCategories.includes(category.id)}
              onChange={() => handleCategoryChange(category.id)}
            />
          ))}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="region-select" className={styles.formLabel}>
            {t("regionLabel")}
          </label>
          <AsyncSelect
            instanceId="region" // 👈 id estable para SSR/CSR
            inputId="region-select" // 👈 vincula el <label> con el control
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadRegions}
            onChange={handleRegionChange}
            value={regions}
            placeholder={t("regionPlaceholder")}
            key={locale} // 👈 (opcional) re-monta al cambiar idioma
          />
        </div>
        {/* 🔽 Galería de imágenes adicionales */}
        <ImageGalleryManager gallery={gallery} setGallery={setGallery} />

        <div className={styles.formGroup}>
          <label htmlFor="topic-select" className={styles.formLabel}>
            {t("topicLabel")}
          </label>
          <AsyncSelect
            instanceId="topic" // 👈 id estable
            inputId="topic-select" // 👈 vincula el <label>
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadTopics}
            onChange={handleTopicChange}
            value={topics}
            placeholder={t("topicPlaceholder")}
            key={locale}
          />
        </div>
        <QuillEditor
          onChange={(value) => setContent(value)} // Actualiza el contenido
          resetTrigger={resetTrigger}
        />

        <ToggleSwitch
          id="additionalInfoToggle"
          label={t("additionalInfoToggle")}
          checked={additionalInfoEnabled}
          onChange={(e) => setAdditionalInfoEnabled(e.target.checked)}
        />

        {additionalInfoEnabled && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("additionalInfo")}</label>
            <QuillEditor
              value={additionalInfo}
              onChange={(value) => setAdditionalInfo(value)} // HTML enriquecido
              resetTrigger={resetTrigger} // para que se limpie al resetear
            />
          </div>
        )}

        {/* TIPO DE ARTÍCULO */}
        <SelectField
          id="beitragstyp"
          label={t("typeLabel")}
          options={beitragstypOptions}
          value={selectedBeitragstyp}
          onChange={(e) => setSelectedBeitragstyp(e.target.value)}
          placeholder={t("typePlaceholder")}
        />

        {/* BUCHBESPRECHUNG (Detalles de libro) */}
        {isBuchBesprechung && (
          <div>
            <h3>{t("bookDetailsTitle")}</h3>
            <InputField
              id="mediaTitle"
              label={t("bookTitle")}
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              placeholder={t("bookTitlePlaceholder")}
            />
          </div>
        )}

        {/* NACHRUF (Necrológica) */}
        {isNachruf && (
          <div>
            <h3>{t("nachrufTitle")}</h3>
            <InputField
              id="deceasedFirstName"
              label={t("firstName")}
              value={deceasedFirstName}
              onChange={(e) => setDeceasedFirstName(e.target.value)}
              placeholder={t("firstNamePlaceholder")}
            />
            <InputField
              id="deceasedLastName"
              label={t("lastName")}
              value={deceasedLastName}
              onChange={(e) => setDeceasedLastName(e.target.value)}
              placeholder={t("lastNamePlaceholder")}
            />
            <InputField
              id="dateOfBirth"
              label={t("birthYear")}
              value={dateOfBirth || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) setDateOfBirth(value);
              }}
              placeholder={t("birthYearPlaceholder")}
            />
            <InputField
              id="dateOfDeath"
              label={t("deathYear")}
              value={dateOfDeath || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) setDateOfDeath(value);
              }}
              placeholder={t("deathYearPlaceholder")}
            />
          </div>
        )}

        {/* SUBTIPO (si existen) */}
        {subtypen.length > 0 && (
          <SelectField
            id="subtyp"
            label={t("subtypeLabel")}
            options={subtypOptions}
            value={selectedSubtyp}
            onChange={(e) => setSelectedSubtyp(e.target.value)}
            placeholder={t("subtypePlaceholder")}
          />
        )}

        {/* AUTORES */}
        <div className={styles.authorSection}>
          <label className={styles.formLabel}>{t("author")}</label>
          <AsyncSelect
            instanceId="authors"
            inputId="author-select"
            isMulti
            cacheOptions
            defaultOptions={authors.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
            loadOptions={loadAuthors}
            value={selectedAuthors}
            onChange={(selected) => setSelectedAuthors(selected || [])}
            placeholder={t("authorPlaceholder")}
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={styles.addAuthorButton}
          >
            {t("newAuthor")}
          </button>
        </div>

        {/* ENTREVISTA */}
        <ToggleSwitch
          id="isInterview"
          label={t("interviewToggle")}
          checked={isInterview}
          onChange={(e) => setIsInterview(e.target.checked)}
        />

        {isInterview && (
          <>
            <label className={styles.formLabel}>{t("interviewee")}</label>
            <AsyncSelect
              instanceId="interviewees"
              inputId="interviewee-select"
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={loadInterviewees}
              value={selectedInterviewees}
              onChange={(selected) => setSelectedInterviewees(selected || [])}
              placeholder={t("intervieweePlaceholder")}
            />
            <button
              type="button"
              onClick={() => setIsIntervieweeModalOpen(true)}
              className={styles.addAuthorButton}
            >
              {t("newInterviewee")}
            </button>
          </>
        )}

        <ToggleSwitch
          id="useCustomDate"
          label={t("useCustomDateToggle")}
          checked={useCustomDate}
          onChange={(e) => setUseCustomDate(e.target.checked)}
        />

        {useCustomDate && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("articleDateLabel")}
              <span className="text-sm text-gray-500 ml-1">
                ({t("articleDateHint")})
              </span>
            </label>
            <input
              type="datetime-local"
              value={
                publicationDate
                  ? publicationDate.toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                const date = new Date(e.target.value);
                setPublicationDate(isNaN(date.getTime()) ? null : date);
              }}
            />
          </div>
        )}
        <SubmitButton label={t("submitButton")} />
      </form>
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2>{t("authorModal.title")}</h2>
          <InputField
            id="newAuthorName"
            label={t("authorModal.nameLabel")}
            value={newAuthorName}
            onChange={(e) => setNewAuthorName(e.target.value)}
            placeholder={t("authorModal.namePlaceholder")}
          />
          <InputField
            id="newAuthorEmail"
            label={t("authorModal.emailLabel")}
            value={newAuthorEmail}
            onChange={(e) => setNewAuthorEmail(e.target.value)}
            placeholder={t("authorModal.emailPlaceholder")}
          />
          <button onClick={handleAddAuthor} className={styles.addAuthorButton}>
            {t("authorModal.addButton")}
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
