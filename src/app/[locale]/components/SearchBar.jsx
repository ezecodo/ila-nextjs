"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import styles from "./SearchBar.module.css";
import { useTranslations } from "next-intl";

const SearchBar = () => {
  const t = useTranslations("search");

  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return; // No buscar si está vacío

    router.push(`/search?query=${encodeURIComponent(query)}`); // ✅ Redirige a la página de búsqueda
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
