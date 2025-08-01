"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import styles from "./SearchBar.module.css";
import { useTranslations } from "next-intl";

const SearchBar = () => {
  const t = useTranslations("search");

  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

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
      <input
        type="text"
        placeholder={t("placeholder")}
        className={styles.searchInput}
        aria-label={t("ariaLabel")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
