import styles from "./SearchBar.module.css";

const SearchBar = () => (
  <div className={styles.searchContainer}>
    <input
      type="text"
      placeholder="Buscar en ILA..."
      className={styles.searchInput}
    />
    <button className={styles.searchButton}>Buscar</button>
  </div>
);

export default SearchBar;
