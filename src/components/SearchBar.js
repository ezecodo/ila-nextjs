"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import styles from "./SearchBar.module.css";

const SearchBar = () => {
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
        placeholder="Buscar en ILA..."
        className={styles.searchInput}
        aria-label="Buscar en ILA"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className={styles.searchButton} aria-label="Buscar">
        <FaSearch />
      </button>
    </form>
  );
};

export default SearchBar;
