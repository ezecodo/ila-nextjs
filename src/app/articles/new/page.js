"use client";

import { useState, useEffect } from "react";
import InputField from "./components/InputField";
import TextAreaField from "./components/TextAreaField";
import SelectField from "./components/SelectField";
import ToggleSwitch from "./components/ToggleSwitch";
import FormMessage from "./components/FormMessage";
import SubmitButton from "./components/SubmitButton";
import Modal from "./components/Modal";
import styles from "./NewArticlePage.module.css";

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBeitragstyp) {
      setMessage("Seleccione un tipo de artículo.");
      return;
    }

    if (isPrinted && (!selectedEdition || !startPage || !endPage)) {
      setMessage(
        "Complete todos los campos relacionados con la edición impresa."
      );
      return;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          content,
          beitragstypId: selectedBeitragstyp,
          beitragssubtypId: selectedSubtyp || null,
          isPrinted,
          editionId: isPrinted ? parseInt(selectedEdition, 10) : null,
          startPage: isPrinted ? parseInt(startPage, 10) : null,
          endPage: isPrinted ? parseInt(endPage, 10) : null,
          authorId: selectedAuthor || null,
          intervieweeId: isInterview ? parseInt(selectedInterviewee, 10) : null, // Entrevistado
        }),
      });

      if (res.ok) {
        setMessage("Artículo creado con éxito.");
        setTitle("");
        setSubtitle("");
        setContent("");
        setSelectedBeitragstyp("");
        setSelectedSubtyp("");
        setIsPrinted(false);
        setSelectedEdition("");
        setStartPage("");
        setEndPage("");
        setSelectedAuthor("");
        setSelectedInterviewee("");
        setIsInterview(false);
      } else {
        setMessage("Error desconocido al crear el artículo.");
      }
    } catch {
      setMessage("Error al enviar los datos.");
    }
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
          name: newAuthorName,
          email: newAuthorEmail || null,
        }),
      });

      if (res.ok) {
        const newAuthor = await res.json();
        setAuthors((prev) => [...prev, newAuthor]);
        setSelectedAuthor(newAuthor.id);
        setMessage("Autor agregado con éxito.");
        setIsModalOpen(false);
        setNewAuthorName("");
        setNewAuthorEmail("");
      } else {
        setMessage("Error al agregar el autor.");
      }
    } catch {
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
    } catch (error) {
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
        <TextAreaField
          id="content"
          label="Contenido"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ingrese el contenido"
        />
        <SelectField
          id="beitragstyp"
          label="Tipo de Artículo"
          options={beitragstypen}
          value={selectedBeitragstyp}
          onChange={(e) => setSelectedBeitragstyp(e.target.value)}
          placeholder="Seleccione un tipo"
        />
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
