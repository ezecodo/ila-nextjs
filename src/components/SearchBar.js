// SearchBar.jsx

import { FaSearch } from "react-icons/fa"; // Importa el ícono de búsqueda
import styles from "./SearchBar.module.css";

const SearchBar = () => (
  <div className={styles.searchContainer}>
    <input
      type="text"
      placeholder="Buscar en ILA..."
      className={styles.searchInput}
      aria-label="Buscar en ILA" // Mejora la accesibilidad
    />
    <button className={styles.searchButton} aria-label="Buscar">
      <FaSearch /> {/* Inserta el ícono de búsqueda */}
    </button>
  </div>
);

export default SearchBar;
