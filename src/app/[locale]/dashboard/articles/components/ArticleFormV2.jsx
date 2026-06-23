"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import InputField from "../../../components/Articles/NewArticle/InputField";
import SelectField from "../../../components/Articles/NewArticle/SelectField";
import ToggleSwitch from "../../../components/Articles/NewArticle/ToggleSwitch";
import FormMessage from "../../../components/Articles/NewArticle/FormMessage";
import SubmitButton from "../../../components/Articles/NewArticle/SubmitButton";
import Modal from "../../../components/Articles/NewArticle/Modal";
import CheckboxField from "../../../components/Articles/NewArticle/CheckboxField";
import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";
import SuccessCelebration from "../../../components/Articles/SuccessCelebration/SuccessCelebration";
import styles from "../../../../styles/global.module.css";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);
const InterviewEditor = dynamic(
  () => import("../../../components/InterviewEditor/InterviewEditor"),
  { ssr: false }
);

// ── Section card wrapper ───────────────────────────────────────────────────
function Section({ step, title, subtitle, children, highlight }) {
  return (
    <div
      className={`rounded-xl border bg-white shadow-sm ${
        highlight ? "border-[#BD0E0D]" : "border-gray-200"
      }`}
    >
      <div
        className={`px-6 py-4 border-b flex items-center gap-3 rounded-t-xl ${
          highlight
            ? "bg-[#BD0E0D]/5 border-[#BD0E0D]/20"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {step && (
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
              highlight
                ? "bg-[#BD0E0D] text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {step}
          </span>
        )}
        <div>
          <h3
            className={`font-bold text-sm ${
              highlight ? "text-[#BD0E0D]" : "text-gray-700"
            }`}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

// ── Main shared form component ─────────────────────────────────────────────
// articleId: undefined → create mode | string/number → edit mode
export default function ArticleFormV2({ articleId }) {
  useSession();
  const router = useRouter();
  const t = useTranslations("newArticle.form");
  const locale = useLocale();

  const isEditMode = Boolean(articleId);

  // ── State ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [contentES, setContentES] = useState("");
  const [articleLoaded, setArticleLoaded] = useState(false);
  const [legacyPath, setLegacyPath] = useState("");
  const [hasSpanishContent, setHasSpanishContent] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(false);


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
  const [celebrateCount, setCelebrateCount] = useState(null);
  const [createdTarget, setCreatedTarget] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedInterviewees, setSelectedInterviewees] = useState([]);
  const [isIntervieweeModalOpen, setIsIntervieweeModalOpen] = useState(false);
  const [newIntervieweeName, setNewIntervieweeName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorEmail, setNewAuthorEmail] = useState("");
  const [isInterview, setIsInterview] = useState(false);

  const [publicationDate, setPublicationDate] = useState(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  // Estado de publicación real del artículo al cargarlo: al editar sin tocar la
  // fecha se preserva (editar no debe publicar un borrador).
  const [initialIsPublished, setInitialIsPublished] = useState(false);

  const [deceasedFirstName, setDeceasedFirstName] = useState("");
  const [deceasedLastName, setDeceasedLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");

  const [previewTextEnabled, setPreviewTextEnabled] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [additionalInfoEnabled, setAdditionalInfoEnabled] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topics, setTopics] = useState([]);

  const [bookImage, setBookImage] = useState(null);
  const [mediaTitle, setMediaTitle] = useState("");
  const [gallery, setGallery] = useState([]);
  const [inlineImageUrls, setInlineImageUrls] = useState([]);

  // PDFs: existingPdfs comes from backend (edit mode); newPdfs are added in form
  const [existingPdfs, setExistingPdfs] = useState([]);
  const [removePdfIds, setRemovePdfIds] = useState([]);
  const [newPdfs, setNewPdfs] = useState([]);

  const fileInputRef = useRef(null);

  // ── Derived ────────────────────────────────────────────────────────────
  const selectedTypObj = beitragstypen.find(
    (typ) => typ.id === parseInt(selectedBeitragstyp, 10)
  );
  const isBuchBesprechung = selectedTypObj?.name === "Buchbesprechung";
  const isNachruf = selectedTypObj?.name === "Nachruf";

  const beitragstypOptions = beitragstypen.map((typ) => ({
    id: typ.id,
    name: locale === "es" && typ.nameES ? typ.nameES : typ.name,
  }));
  const subtypOptions = subtypen.map((s) => ({
    id: s.id,
    name: locale === "es" && s.nameES ? s.nameES : s.name,
  }));

  // ── Data loaders ───────────────────────────────────────────────────────
  const flattenTopics = (nodes, parentName = "") => {
    const options = [];
    nodes.forEach((node) => {
      const label = parentName ? `${parentName} > ${node.name}` : node.name;
      options.push({ value: node.id, label });
      if (node.children?.length > 0)
        options.push(...flattenTopics(node.children, label));
    });
    return options;
  };

  const loadTopics = async (inputValue) => {
    const q = (inputValue || "").trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/topics?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      const flat = flattenTopics(data);
      const norm = (s) => (s || "").trim().toLowerCase();
      const nq = norm(q);
      const exact = flat.filter((o) => norm(o.label) === nq);
      const starts = flat.filter(
        (o) => norm(o.label).startsWith(nq) && norm(o.label) !== nq
      );
      const includes = flat.filter(
        (o) => norm(o.label).includes(nq) && !norm(o.label).startsWith(nq)
      );
      const maybeCreate =
        exact.length === 0
          ? [{ value: "new", label: `${t("createTopicPrefix")}: "${q}"`, __inputValue: q }]
          : [];
      return [...maybeCreate, ...exact, ...starts, ...includes];
    } catch {
      return [];
    }
  };

  const loadInterviewees = async (inputValue) => {
    try {
      const res = await fetch("/api/interviewees");
      if (!res.ok) return [];
      const data = await res.json();
      return data
        .filter((i) => i.name.toLowerCase().includes((inputValue || "").toLowerCase()))
        .map((i) => ({ value: i.id, label: i.name }));
    } catch {
      return [];
    }
  };

  const loadAuthors = async (inputValue) => {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) return [];
      const data = await res.json();
      return data
        .filter((a) => a.name.toLowerCase().includes((inputValue || "").toLowerCase()))
        .map((a) => ({ value: a.id, label: a.name }));
    } catch {
      return [];
    }
  };

  const flattenRegions = (nodes, parentName = "") => {
    const options = [];
    nodes.forEach((node) => {
      const label = parentName ? `${parentName} > ${node.name}` : node.name;
      options.push({ value: node.id, label });
      if (node.children?.length > 0)
        options.push(...flattenRegions(node.children, label));
    });
    return options;
  };

  const loadRegions = async (inputValue) => {
    try {
      const res = await fetch("/api/regions");
      if (!res.ok) return [];
      const data = await res.json();
      const flat = flattenRegions(data);
      const norm = (s) => (s || "").trim().toLowerCase();
      const nq = norm(inputValue || "");
      if (!nq) return flat.slice(0, 50);
      const exact = flat.filter((o) => norm(o.label) === nq);
      const starts = flat.filter(
        (o) => norm(o.label).startsWith(nq) && norm(o.label) !== nq
      );
      const includes = flat.filter(
        (o) => norm(o.label).includes(nq) && !norm(o.label).startsWith(nq)
      );
      return [...exact, ...starts, ...includes];
    } catch {
      return [];
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/beitragstypen")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBeitragstypen)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/editions")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEditions(data.sort((a, b) => b.number - a.number)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/authors")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAuthors)
      .catch(() => {});
  }, []);

  // Auto-marcar "Nur Online" cuando no está impreso
  useEffect(() => {
    const soloEnLinea = categories.find(
      (c) => c.name === "Nur Online" || c.nameES === "Solo en Línea"
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

  // Update subtypes based on selected beitragstyp
  useEffect(() => {
    if (!selectedBeitragstyp) return;
    const typ = beitragstypen.find(
      (t) => t.id === parseInt(selectedBeitragstyp, 10)
    );
    if (typ?.children?.length > 0) {
      setSubtypen(typ.children);
    } else if (typ?.subtypes?.length > 0) {
      setSubtypen(typ.subtypes);
    } else {
      setSubtypen([]);
    }
    setIsInterview(typ?.name === "Interview");
  }, [selectedBeitragstyp, beitragstypen]);

  // Load existing article data in edit mode
  useEffect(() => {
    if (!articleId) return;
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        if (!res.ok) throw new Error("Error al cargar el artículo");
        const article = await res.json();

        setTitle(locale === "es" ? (article.titleES || article.title || "") : (article.title || ""));
        setSubtitle(locale === "es" ? (article.subtitleES || article.subtitle || "") : (article.subtitle || ""));
        setContent(locale === "es" ? (article.contentES || "") : (article.content || ""));
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
          article.interviewees?.map((i) => ({ value: i.id, label: i.name })) || []
        );
        if (article.isInterview || (article.interviewees?.length > 0)) {
          setIsInterview(true);
        }
        setPublicationDate(
          article.publicationDate ? new Date(article.publicationDate) : null
        );
        setInitialIsPublished(article.isPublished || false);
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
        setDeceasedFirstName(article.deceasedFirstName || "");
        setDeceasedLastName(article.deceasedLastName || "");
        setDateOfBirth(article.dateOfBirth || "");
        setDateOfDeath(article.dateOfDeath || "");
        setExistingPdfs(article.pdfs || []);

        if (article.images?.length > 0) {
          setGallery(
            article.images.map((img, index) => ({
              id: img.id,
              url: img.url,
              title: img.title || "",
              alt: img.alt || "",
              isCover: index === 0,
              order: index + 1,
            }))
          );
        }
        setLegacyPath(article.legacyPath || "");
        setContentES(article.contentES || "");
        setHasSpanishContent(!!article.contentES);
        setArticleLoaded(true);
      } catch (err) {
        console.error("Error cargando artículo:", err);
        setMessage("Error cargando el artículo.");
      }
    };
    fetchArticle();
  }, [articleId]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleRegionChange = async (selectedOptions) => {
    const last = selectedOptions?.[selectedOptions.length - 1];
    if (last?.value === "new") {
      const rawName = last.__inputValue || last.label;
      try {
        const res = await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        if (res.ok) {
          const newRegion = await res.json();
          setRegions([
            ...selectedOptions.slice(0, -1),
            { value: newRegion.id, label: newRegion.name },
          ]);
        }
      } catch {}
    } else {
      setRegions(selectedOptions || []);
    }
  };

  const handleTopicChange = async (selectedOptions) => {
    const last = selectedOptions?.[selectedOptions.length - 1];
    if (last?.value === "new") {
      const rawName = last.__inputValue || last.label;
      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        if (res.ok) {
          const newTopic = await res.json();
          setTopics([
            ...selectedOptions.slice(0, -1),
            { value: newTopic.id, label: newTopic.name },
          ]);
        }
      } catch {}
    } else {
      setTopics(selectedOptions || []);
    }
  };

  const handleAddAuthor = async () => {
    if (!newAuthorName) return setMessage("El nombre del autor es obligatorio.");
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
        setAuthors((prev) => [...prev, { id: newAuthor.id, name: newAuthor.name }]);
        setSelectedAuthors((prev) => [
          ...prev,
          { value: newAuthor.id, label: newAuthor.name },
        ]);
        setIsModalOpen(false);
        setNewAuthorName("");
        setNewAuthorEmail("");
      }
    } catch {}
  };

  const handleAddInterviewee = async () => {
    if (!newIntervieweeName) return;
    try {
      const res = await fetch("/api/interviewees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newIntervieweeName }),
      });
      if (res.ok) {
        const newInt = await res.json();
        setSelectedInterviewees((prev) => [
          ...prev,
          { value: newInt.id, label: newInt.name },
        ]);
        setIsIntervieweeModalOpen(false);
        setNewIntervieweeName("");
      }
    } catch {}
  };

  const resetForm = () => {
    setTitle(""); setSubtitle(""); setContent("");
    setResetTrigger((p) => !p);
    setSelectedBeitragstyp(""); setSelectedSubtyp("");
    setIsPrinted(false); setSelectedEdition("");
    setStartPage(""); setEndPage("");
    setSelectedAuthors([]); setSelectedInterviewees([]);
    setIsInterview(false);
    setDeceasedFirstName(""); setDeceasedLastName("");
    setDateOfBirth(""); setDateOfDeath("");
    setPreviewTextEnabled(false); setPreviewText("");
    setUseCustomDate(false); setPublicationDate(null);
    setAdditionalInfo(""); setAdditionalInfoEnabled(false);
    setSelectedCategories([]); setRegions([]); setTopics([]);
    setMediaTitle(""); setBookImage(null);
    setGallery([]); setInlineImageUrls([]);
    setNewPdfs([]); setExistingPdfs([]); setRemovePdfIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle || "");
    formData.append("content", content);
    if (contentES) formData.append("contentES", contentES);

    // Gallery images
    gallery.forEach((img, idx) => {
      if (img.file) formData.append(`gallery[${idx}][file]`, img.file);
      if (img.id) formData.append(`gallery[${idx}][id]`, img.id);
      formData.append(`gallery[${idx}][title]`, img.title || "");
      formData.append(`gallery[${idx}][alt]`, img.alt || "");
      formData.append(`gallery[${idx}][isCover]`, img.isCover ? "true" : "false");
      formData.append(`gallery[${idx}][order]`, String(idx));
    });
    // In edit mode, tell backend which existing images to keep
    if (isEditMode) {
      const keepIds = gallery.filter((img) => img.id).map((img) => img.id);
      formData.append("keepImages", JSON.stringify(keepIds));
    }

    formData.append("authors", JSON.stringify(selectedAuthors.map((a) => a.value)));
    formData.append("regions", JSON.stringify(regions.map((r) => r.value)));
    formData.append("topics", JSON.stringify(topics.map((t) => t.value)));
    formData.append("beitragstypId", selectedBeitragstyp);
    formData.append("beitragssubtypId", selectedSubtyp || null);

    if (isPrinted) {
      formData.append("isPrinted", isPrinted);
      formData.append("editionId", selectedEdition);
      formData.append("startPage", startPage);
      formData.append("endPage", endPage);
    }
    if (isBuchBesprechung) {
      if (bookImage) formData.append("bookImage", bookImage);
      formData.append("mediaTitle", mediaTitle);
    }
    if (isInterview) {
      formData.append("isInterview", isInterview);
      formData.append("interviewees", JSON.stringify(selectedInterviewees.map((i) => i.value)));
    }
    if (isNachruf) {
      formData.append("deceasedFirstName", deceasedFirstName);
      formData.append("deceasedLastName", deceasedLastName);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("dateOfDeath", dateOfDeath);
    }
    if (previewTextEnabled) formData.append("previewText", previewText);
    if (additionalInfoEnabled) formData.append("additionalInfo", additionalInfo);

    // Publication date
    let finalDate = publicationDate;
    let finalIsPublished = true;
    if (isEditMode) {
      if (useCustomDate && publicationDate) {
        finalDate = publicationDate;
        finalIsPublished = publicationDate <= new Date();
      } else {
        finalDate = publicationDate;
        finalIsPublished = initialIsPublished;
      }
      formData.append("useCustomDate", useCustomDate);
    } else {
      if (!useCustomDate) {
        finalDate = new Date();
        finalIsPublished = true;
      } else if (publicationDate) {
        finalIsPublished = new Date(publicationDate) <= new Date();
      }
    }
    if (finalDate) {
      const utcDate = new Date(finalDate.getTime() - finalDate.getTimezoneOffset() * 60000);
      formData.append("publicationDate", utcDate.toISOString());
    } else {
      formData.append("publicationDate", new Date().toISOString());
    }
    formData.append("isPublished", finalIsPublished);
    formData.append("categories", JSON.stringify(selectedCategories));

    if (inlineImageUrls.length > 0)
      formData.append("inlineImageUrls", JSON.stringify(inlineImageUrls));

    // PDFs
    if (isEditMode) {
      if (removePdfIds.length > 0)
        formData.append("removePdfIds", JSON.stringify(removePdfIds));
      newPdfs.forEach((pdf, idx) => {
        if (pdf.file) formData.append(`pdfs[${idx}][file]`, pdf.file);
        formData.append(`pdfs[${idx}][title]`, pdf.title || "");
      });
    } else {
      newPdfs.forEach((pdf, idx) => {
        if (pdf.file) formData.append(`pdfs[${idx}][file]`, pdf.file);
        formData.append(`pdfs[${idx}][title]`, pdf.title || "");
      });
    }

    try {
      const url = isEditMode ? `/api/articles/${articleId}` : "/api/articles";
      const method = isEditMode ? "PUT" : "POST";

      // En modo ES y edit: guardar solo contentES/titleES/subtitleES via JSON
      if (locale === "es" && isEditMode) {
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentES: content,
            titleES: title,
            subtitleES: subtitle || null,
            translationStatus: "approved",
          }),
        });
        if (res.ok) {
          setMessage("✅ Versión en español guardada.");
        } else {
          setMessage("❌ Error al guardar la versión en español.");
        }
        return;
      }

      const res = await fetch(url, { method, body: formData });

      if (res.ok) {
        if (isEditMode) {
          const updated = await res.json();
          if (updated.legacyPath) {
            router.push(`/de${updated.legacyPath}`);
          } else {
            router.push(`/de/articles/${updated.id}`);
          }
        } else {
          let total = null;
          try {
            const created = await res.json();
            total = created?.totalArticles ?? null;
            if (created?.legacyPath) {
              setCreatedTarget(`/${locale}${created.legacyPath}`);
            } else if (created?.id) {
              setCreatedTarget(`/${locale}/articles/${created.id}`);
            }
          } catch {
            /* sin total: el modal igual celebra */
          }
          setCelebrateCount(typeof total === "number" ? total : -1);
          resetForm();
        }
      } else {
        const errText = await res.text();
        setMessage(`Error al ${isEditMode ? "editar" : "crear"} el artículo: ${errText}`);
      }
    } catch {
      setMessage("Error al enviar los datos.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ─────────────────────────────────────────────────────────────
  // ── Modo traducción ES: formulario simplificado ────────────────────────
  if (locale === "es" && isEditMode) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-blue-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              🇪🇸 Versión en español
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">ID {articleId} · Solo se edita el contenido traducido</p>
          </div>
        </div>

        {message && <FormMessage message={message} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título (ES)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Título en español…"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subtítulo (ES)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-none"
                placeholder="Subtítulo en español…"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Contenido (ES)</label>
            {articleLoaded ? (
              <InterviewEditor
                key={articleId}
                value={content}
                onChange={setContent}
                onUrlInserted={(url) => setInlineImageUrls((prev) => [...prev, url])}
                title={title}
                subtitle={subtitle}
                articleLegacyPath={legacyPath}
                articleId={articleId}
                hasSpanishContent={hasSpanishContent}
                contentES={contentES}
                onChangeES={setContentES}
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Cargando contenido…</div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm">
              💾 Guardar versión ES
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-8 rounded-full bg-[#BD0E0D]" />
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {isEditMode ? `${t("editArticle")}: ${title || "…"}` : "Neuer Artikel"}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {isEditMode ? `ID ${articleId}` : "Formulario mejorado · v2"}
          </p>
        </div>
      </div>

      {message && <FormMessage message={message} />}

      <SuccessCelebration
        open={celebrateCount !== null}
        total={celebrateCount >= 0 ? celebrateCount : undefined}
        title={t("successCelebrationTitle")}
        countLabel={t("successCelebrationCount")}
        praise={t("successCelebrationPraise")}
        closeLabel={t("successCelebrationClose")}
        onClose={() => {
          setCelebrateCount(null);
          if (createdTarget) {
            const target = createdTarget;
            setCreatedTarget(null);
            router.push(target);
          }
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── STEP 1: Tipo de artículo ─────────────────────────────── */}
        <Section
          step="1"
          title={t("typeLabel")}
          subtitle="Define el tipo primero — el formulario se adapta"
          highlight={!selectedBeitragstyp}
        >
          <SelectField
            id="beitragstyp"
            label=""
            options={beitragstypOptions}
            value={selectedBeitragstyp}
            onChange={(e) => setSelectedBeitragstyp(e.target.value)}
            placeholder={t("typePlaceholder")}
          />
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
          {isInterview && (
            <div className="flex items-center gap-2 bg-[#BD0E0D]/5 border border-[#BD0E0D]/20 rounded-lg px-4 py-3">
              <span className="text-[#BD0E0D] text-lg">🎤</span>
              <p className="text-sm text-[#BD0E0D] font-medium">
                Modus Interview aktiv — das Inhaltsfeld wechselt zum strukturierten Frage/Antwort-Editor
              </p>
            </div>
          )}
        </Section>

        {/* ── STEP 2: Gedruckte Ausgabe ────────────────────────────── */}
        {selectedBeitragstyp && (
          <Section
            step="2"
            title="Gedruckte Ausgabe"
            subtitle="Gehört der Artikel zu einem gedruckten Heft?"
          >
            <ToggleSwitch
              id="isPrinted"
              label={t("printedToggle")}
              checked={isPrinted}
              onChange={(e) => setIsPrinted(e.target.checked)}
            />
            {isPrinted && (
              <div className="space-y-3">
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
                <div className="flex gap-4">
                  <div className="flex-1">
                    <InputField id="startPage" label={t("startPage")} value={startPage} onChange={(e) => setStartPage(e.target.value)} placeholder={t("startPagePlaceholder")} />
                  </div>
                  <div className="flex-1">
                    <InputField id="endPage" label={t("endPage")} value={endPage} onChange={(e) => setEndPage(e.target.value)} placeholder={t("endPagePlaceholder")} />
                  </div>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── STEP 3: Título y subtítulo ───────────────────────────── */}
        {selectedBeitragstyp && (
          <Section step="3" title="Titel & Untertitel">
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
              label={t("previewToggle")}
              checked={previewTextEnabled}
              onChange={(e) => {
                setPreviewTextEnabled(e.target.checked);
                if (!e.target.checked) setPreviewText("");
              }}
            />
            {previewTextEnabled && (
              <QuillEditor
                value={previewText}
                onChange={setPreviewText}
                resetTrigger={resetTrigger}
                toolbar={[["link"], ["poem"], ["dossier"]]}
              />
            )}
          </Section>
        )}

        {/* ── STEP 4: Contenido ────────────────────────────────────── */}
        {selectedBeitragstyp && (
          <Section
            step="4"
            title={isInterview ? "Fragen & Antworten" : "Inhalt"}
            subtitle={
              isInterview
                ? "Jede Frage wird automatisch fett dargestellt und überlebt die DeepL-Übersetzung"
                : "Texto principal del artículo"
            }
            highlight={isInterview}
          >
            {isInterview ? (
              <>
                <InterviewEditor
                  value={content}
                  onChange={setContent}
                  onUrlInserted={(url) => setInlineImageUrls((prev) => [...prev, url])}
                  title={title}
                  subtitle={subtitle}
                  articleLegacyPath={legacyPath}
                  articleId={articleId}
                  hasSpanishContent={hasSpanishContent}
                  contentES={contentES}
                  onChangeES={setContentES}
                />
                {/* Entrevistado */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
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
                </div>
              </>
            ) : (
              <InterviewEditor
                value={content}
                onChange={setContent}
                onUrlInserted={(url) => setInlineImageUrls((prev) => [...prev, url])}
                title={title}
                subtitle={subtitle}
                articleLegacyPath={legacyPath}
                articleId={articleId}
                hasSpanishContent={hasSpanishContent}
                contentES={contentES}
                onChangeES={setContentES}
              />
            )}
          </Section>
        )}

        {/* ── STEP 5: Autores e imágenes ───────────────────────────── */}
        {selectedBeitragstyp && (
          <Section step="5" title="Autoren & Bilder">
            <div className={styles.authorSection}>
              <label className={styles.formLabel}>{t("author")}</label>
              <AsyncSelect
                instanceId="authors"
                inputId="author-select"
                isMulti
                cacheOptions
                defaultOptions={authors.map((a) => ({ value: a.id, label: a.name }))}
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
            <ImageGalleryManager gallery={gallery} setGallery={setGallery} />
          </Section>
        )}

        {/* ── STEP 6: Clasificación ────────────────────────────────── */}
        {selectedBeitragstyp && (
          <Section step="6" title="Klassifizierung" subtitle="Kategorien, Regionen, Themen">
            <div>
              <h3 className={styles.formLabel}>{t("categoryLabel")}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {categories.map((category) => (
                  <CheckboxField
                    key={category.id}
                    id={`category-${category.id}`}
                    label={locale === "es" && category.nameES ? category.nameES : category.name}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="region-select" className={styles.formLabel}>
                {t("regionLabel")}
              </label>
              <AsyncSelect
                instanceId="region"
                inputId="region-select"
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadRegions}
                onChange={handleRegionChange}
                value={regions}
                placeholder={t("regionPlaceholder")}
                key={locale}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="topic-select" className={styles.formLabel}>
                {t("topicLabel")}
              </label>
              <AsyncSelect
                instanceId="topic"
                inputId="topic-select"
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
          </Section>
        )}

        {/* ── STEP 7: Opciones adicionales ─────────────────────────── */}
        {selectedBeitragstyp && (
          <Section step="7" title="Weitere Optionen">
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
                  onChange={setAdditionalInfo}
                  resetTrigger={resetTrigger}
                  toolbar={[["link"], ["poem"], ["dossier"]]}
                />
              </div>
            )}

            {isBuchBesprechung && (
              <div>
                <h3 className={styles.formLabel}>{t("bookDetailsTitle")}</h3>
                <InputField
                  id="mediaTitle"
                  label={t("bookTitle")}
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder={t("bookTitlePlaceholder")}
                />
              </div>
            )}

            {isNachruf && (
              <div className="space-y-3">
                <h3 className={styles.formLabel}>{t("nachrufTitle")}</h3>
                <InputField id="deceasedFirstName" label={t("firstName")} value={deceasedFirstName} onChange={(e) => setDeceasedFirstName(e.target.value)} placeholder={t("firstNamePlaceholder")} />
                <InputField id="deceasedLastName" label={t("lastName")} value={deceasedLastName} onChange={(e) => setDeceasedLastName(e.target.value)} placeholder={t("lastNamePlaceholder")} />
                <InputField id="dateOfBirth" label={t("birthYear")} value={dateOfBirth} onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) setDateOfBirth(e.target.value); }} placeholder={t("birthYearPlaceholder")} />
                <InputField id="dateOfDeath" label={t("deathYear")} value={dateOfDeath} onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) setDateOfDeath(e.target.value); }} placeholder={t("deathYearPlaceholder")} />
              </div>
            )}

            {/* PDFs */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("pdfSectionTitle")}</label>
              {/* Existing PDFs (edit mode) */}
              {existingPdfs.map((pdf) => (
                <div key={pdf.id} className="flex items-center gap-3 mb-2 p-3 border rounded bg-gray-50">
                  <span className="text-sm text-gray-700 flex-1 truncate">{pdf.title || pdf.url}</span>
                  {removePdfIds.includes(pdf.id) ? (
                    <button
                      type="button"
                      onClick={() => setRemovePdfIds((prev) => prev.filter((id) => id !== pdf.id))}
                      className="text-sm text-blue-600 underline"
                    >
                      Wiederherstellen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRemovePdfIds((prev) => [...prev, pdf.id])}
                      className="text-sm text-red-600 underline"
                    >
                      {t("pdfRemove")}
                    </button>
                  )}
                </div>
              ))}
              {/* New PDFs */}
              {newPdfs.map((pdf, idx) => (
                <div key={idx} className="flex flex-col gap-1 mb-3 p-3 border rounded bg-gray-50">
                  <input
                    type="text"
                    placeholder={t("pdfTitlePlaceholder")}
                    value={pdf.title}
                    onChange={(e) => {
                      const u = [...newPdfs];
                      u[idx] = { ...u[idx], title: e.target.value };
                      setNewPdfs(u);
                    }}
                    className={styles.formInput}
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const u = [...newPdfs];
                      u[idx] = { ...u[idx], file: e.target.files?.[0] || null };
                      setNewPdfs(u);
                    }}
                  />
                  {pdf.file && <p className="text-sm text-green-700">✓ {pdf.file.name}</p>}
                  <button
                    type="button"
                    onClick={() => setNewPdfs(newPdfs.filter((_, i) => i !== idx))}
                    className="text-sm text-red-600 underline self-start"
                  >
                    {t("pdfRemove")}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewPdfs([...newPdfs, { file: null, title: "" }])}
                className={styles.addAuthorButton}
              >
                + {t("pdfAddButton")}
              </button>
            </div>
          </Section>
        )}

        {/* ── STEP 8: Publicación ──────────────────────────────────── */}
        {selectedBeitragstyp && (
          <Section step="8" title="Veröffentlichung">
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
                  <span className="text-sm text-gray-500 ml-1">({t("articleDateHint")})</span>
                </label>
                <input
                  type="datetime-local"
                  value={publicationDate ? publicationDate.toISOString().slice(0, 16) : ""}
                  onChange={(e) => setPublicationDate(new Date(e.target.value))}
                  className={styles.formInput}
                />
              </div>
            )}

            <div className="pt-2">
              <SubmitButton label={isEditMode ? t("updateButton") || "Speichern" : t("submitButton")} />
            </div>
          </Section>
        )}

      </form>

      {/* ── Modales ──────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2>{t("authorModal.title")}</h2>
          <InputField id="newAuthorName" label={t("authorModal.nameLabel")} value={newAuthorName} onChange={(e) => setNewAuthorName(e.target.value)} placeholder={t("authorModal.namePlaceholder")} />
          <InputField id="newAuthorEmail" label={t("authorModal.emailLabel")} value={newAuthorEmail} onChange={(e) => setNewAuthorEmail(e.target.value)} placeholder={t("authorModal.emailPlaceholder")} />
          <button onClick={handleAddAuthor} className={styles.addAuthorButton}>{t("authorModal.addButton")}</button>
        </Modal>
      )}
      {isIntervieweeModalOpen && (
        <Modal onClose={() => setIsIntervieweeModalOpen(false)}>
          <h2>Neuen Gesprächspartner hinzufügen</h2>
          <InputField id="newIntervieweeName" label="Name" value={newIntervieweeName} onChange={(e) => setNewIntervieweeName(e.target.value)} placeholder="Vor- und Nachname" />
          <button onClick={handleAddInterviewee} className={styles.addAuthorButton}>Hinzufügen</button>
        </Modal>
      )}


    </div>
  );
}
