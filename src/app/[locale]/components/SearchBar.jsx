"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import styles from "./SearchBar.module.css";
import { useTranslations } from "next-intl";

// Helper: pinta solo “ila” con la clase del logo (tolera "ila...", "ila," etc.)
function renderPlaceholder(text, logoClass) {
  // divide en [texto, "ila", texto] manteniendo la palabra aislada
  return text.split(/(\bila\b)/i).map((part, i) =>
    part.toLowerCase().trim() === "ila" ? (
      <span key={`ila-${i}`} className={logoClass}>
        ila
      </span>
    ) : (
      <span key={`t-${i}`}>{part}</span>
    )
  );
}

const SearchBar = () => {
  const t = useTranslations("search");

  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const inputRef = useRef(null);

  // Mantener sincronizado el valor si cambia en la URL
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className={styles.searchContainer}>
      {/* Placeholder “falso”: solo mientras no hay texto */}
      {!query && (
        <div
          className={styles.customPlaceholder}
          onClick={() => inputRef.current?.focus()}
        >
          {renderPlaceholder(t("placeholder"), styles.logoFont)}
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        aria-label={t("ariaLabel")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
      />

      <button
        type="submit"
        className={styles.searchButton}
        aria-label={t("button")}
      >
        <FaSearch />
      </button>
    </form>
  );
};

export default SearchBar;
