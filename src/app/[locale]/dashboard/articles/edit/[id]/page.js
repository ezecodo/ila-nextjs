"use client";

import { useState, useEffect, useRef } from "react";
import InputField from "../../../../components/Articles/NewArticle/InputField";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import ImageGalleryManager from "../../../../components/Articles/ImageGalleryManager/ImageGalleryManager";

import SelectField from "../../../../components/Articles/NewArticle/SelectField";
import ToggleSwitch from "../../../../components/Articles/NewArticle/ToggleSwitch";
import FormMessage from "../../../../components/Articles/NewArticle/FormMessage";
import SubmitButton from "../../../../components/Articles/NewArticle/SubmitButton";
import Modal from "../../../../components/Articles/NewArticle/Modal";
import styles from "../../../../../styles/global.module.css";
import CheckboxField from "../../../../components/Articles/NewArticle/CheckboxField";

import dynamic from "next/dynamic";

const norm = (s) => (s ?? "").trim().toLowerCase();
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
const QuillEditor = dynamic(
  () => import("../../../../components/QuillEditor/QuillEditor"),
  {
    ssr: false,
  }
);

export default function EditArticlePage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");

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
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorEmail, setNewAuthorEmail] = useState("");
  const [isInterview, setIsInterview] = useState(false); // Toggle para entrevistas
  const [authors, setAuthors] = useState([]);

  const [selectedInterviewees, setSelectedInterviewees] = useState([]); // Entrevistado seleccionado
  const [isIntervieweeModalOpen, setIsIntervieweeModalOpen] = useState(false);
  const [newIntervieweeName, setNewIntervieweeName] = useState("");
  const [isPublished, setIsPublished] = useState(false); // Toggle para "Publicar Ahora"
  const [schedulePublish, setSchedulePublish] = useState(false); // Toggle para "Programar Publicación"
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

  const [gallery, setGallery] = useState([]);

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
    const q = (inputValue || "").trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/topics?search=${encodeURIComponent(q)}`);
      const data = await res.json();

      const flat = flattenTopics(data); // [{ value, label }, ...]
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
                __inputValue: q, // 👈 clave para handleTopicChange
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

      // Filtra según lo que escribe el usuario
      const filtered = data.filter((int) =>
        int.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      // Devuelve en formato que AsyncSelect entiende
      return filtered.map((int) => ({
        value: int.id,
        label: int.name,
      }));
    } catch (error) {
      console.error("Error cargando entrevistados:", error);
      return [];
    }
  };
  const loadAuthors = async (inputValue) => {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) return [];

      const data = await res.json();

      // Filtra según lo que escribe el usuario
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
    const lastOption = selectedOptions?.[selectedOptions.length - 1];

    if (lastOption?.value === "new") {
      // 👇 Usamos el valor crudo que enviamos en loadTopics
      const raw =
        lastOption.__inputValue ??
        lastOption.label
          .replace(`${t("createTopicPrefix")}: "`, "")
          .replace(/"$/, "");

      const newTopic = await createNewTopic(raw);
      if (newTopic) {
        setTopics((prev) => [...prev, newTopic]);
      }
      return; // 👈 importante: no sigas abajo
    }

    setTopics(selectedOptions || []);
  };

  const createNewTopic = async (inputValue) => {
    // Verificar si el tema ya existe

    const exists = topics.some(
      (topic) => norm(topic.label) === norm(inputValue)
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
      setMessage("Error al conectar con el servidor(creado).");
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

  const { id } = useParams();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (!res.ok) throw new Error("Error al cargar el artículo");
        const article = await res.json();

        // Rellenar estados básicos
        setTitle(article.title || "");
        setSubtitle(article.subtitle || "");
        setContent(article.content || "");
        setSelectedBeitragstyp(article.beitragstypId || "");
        setSelectedSubtyp(article.beitragssubtypId || "");
        setIsPrinted(article.isInPrintEdition || false);
        setSelectedEdition(article.editionId || "");
        setStartPage(article.startPage || "");
        setEndPage(article.endPage || "");
        setSelectedAuthors(
          article.authors?.map((a) => ({ value: a.id, label: a.name })) || []
        );
        setSelectedInterviewees(
          article.interviewees?.map((i) => ({ value: i.id, label: i.name })) ||
            []
        );
        setIsInterview(article.isInterview || false);
        setIsPublished(article.isPublished || false);
        setSchedulePublish(article.schedulePublish || false);
        setPublicationDate(
          article.publicationDate ? new Date(article.publicationDate) : null
        );
        setPreviewText(article.previewText || "");
        setPreviewTextEnabled(!!article.previewText);
        setAdditionalInfo(article.additionalInfo || "");
        setAdditionalInfoEnabled(!!article.additionalInfo);
        setSelectedCategories(article.categories?.map((c) => c.id) || []);
        setRegions(
          article.regions?.map((r) => ({ value: r.id, label: r.name })) || []
        );
        setTopics(
          article.topics?.map((t) => ({ value: t.id, label: t.name })) || []
        );
        setMediaTitle(article.mediaTitle || "");

        if (article.interviewees && article.interviewees.length > 0) {
          setIsInterview(true);
        }

        if (article.images && article.images.length > 0) {
          setGallery(
            article.images.map((img, index) => ({
              id: img.id,
              url: img.url,
              title: img.title || "",
              alt: img.alt || "",
              isCover: index === 0, // 👈 opcional: marcamos la primera como portada
              order: index + 1,
            }))
          );
        } else {
          setGallery([]);
        }
      } catch (err) {
        console.error("Error cargando artículo:", err);
        setMessage("Error cargando el artículo.");
      }
    };

    fetchArticle();
  }, [id]);
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
        setMessage("Error al conectar con el servidor.(articulo)");
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
        setMessage("Error al conectar con el servidor.(autores");
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
        setMessage("Error al conectar con el servidor. (Ediciones)");
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

    formData.append("isPublished", isPublished);
    formData.append("schedulePublish", schedulePublish);
    if (publicationDate) {
      formData.append("publicationDate", publicationDate.toISOString());
    }

    // Agregar categorías seleccionadas
    formData.append("categories", JSON.stringify(selectedCategories));
    // 📸 Añadir imágenes de la galería
    gallery.forEach((img, idx) => {
      if (img.file) {
        formData.append(`gallery[${idx}][file]`, img.file);
      }
      formData.append(`gallery[${idx}][title]`, img.title || "");
      formData.append(`gallery[${idx}][alt]`, img.alt || "");
      formData.append(
        `gallery[${idx}][isCover]`,
        img.isCover ? "true" : "false"
      );
    });
    // 📌 Añadir keepImages al FormData
    const keepIds = gallery.filter((img) => img.id).map((img) => img.id);
    formData.append("keepImages", JSON.stringify(keepIds));
    try {
      console.log("Editando artículo con id:", id);
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        body: formData, // Aquí pasamos el FormData
      });

      if (res.ok) {
        setMessage("Artículo editado con éxito.");
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
    setIsPublished(false);
    setSchedulePublish(false);
    setUseCustomDate(false);
    setPublicationDate(null);
    setAdditionalInfo("");
    setAdditionalInfoEnabled(false);
    setSelectedCategories([]);
    setRegions([]);
    setTopics([]);

    setMediaTitle("");
    setBookImage(null);

    setGallery([]);
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

        // Añadir al listado de seleccionados
        setSelectedInterviewees((prev) => [
          ...prev,
          { value: newInterviewee.id, label: newInterviewee.name },
        ]);

        // Mensajes y reset modal
        setMessage("Entrevistado agregado con éxito.");
        setIsIntervieweeModalOpen(false);
        setNewIntervieweeName("");
      } else {
        setMessage("Error al agregar el entrevistado.");
      }
    } catch {
      setMessage("Error al conectar con el servidor(entrevistado).");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.formTitle}>
        {t("editArticle")}: {title || "…"}
      </h1>
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
              value={previewText}
              onChange={(value) => setPreviewText(value)} // Actualiza el contenido
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
            onChange={(selectedOptions) => setRegions(selectedOptions || [])}
            value={regions}
            placeholder={t("regionPlaceholder")}
            key={locale} // 👈 (opcional) re-monta al cambiar idioma
          />
        </div>
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
          value={content}
          onChange={(value) => setContent(value)} // Actualiza el contenido
        />
        <ImageGalleryManager gallery={gallery} setGallery={setGallery} />
        <ToggleSwitch
          id="additionalInfoToggle"
          label={t("additionalInfoToggle")} // Información adicional toogle
          checked={additionalInfoEnabled}
          onChange={(e) => setAdditionalInfoEnabled(e.target.checked)}
        />
        {additionalInfoEnabled && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("additionalInfo")}</label>
            <QuillEditor
              value={additionalInfo}
              onChange={(value) => setAdditionalInfo(value)} // 👈 recibe texto enriquecido
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
            <div className={styles.formGroup}>
              <label htmlFor="bookImage" className={styles.formLabel}>
                {t("bookImage")}
              </label>
              <input
                type="file"
                id="bookImage"
                accept="image/*"
                onChange={(e) => setBookImage(e.target.files[0])}
              />
            </div>
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

        {/* AUTOR */}
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
            loadOptions={loadAuthors} // 👈 ahora usa la función separada
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
              loadOptions={loadInterviewees} // 👈 ahora usa búsqueda dinámica
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
          label="Programar Publicación (futuro)"
          checked={schedulePublish}
          onChange={(e) => {
            setSchedulePublish(e.target.checked);
            if (e.target.checked) setIsPublished(false);
          }}
        />

        <ToggleSwitch
          id="useCustomDate"
          label="Editar fecha del artículo (pasado o futuro)"
          checked={useCustomDate}
          onChange={(e) => setUseCustomDate(e.target.checked)}
        />

        {(useCustomDate || schedulePublish) && (
          <div>
            <label>Fecha del artículo</label>
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
        <SubmitButton label="Actualizar artículo" />
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
