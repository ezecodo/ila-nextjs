import React from "react";
import styles from "./Pagination.module.css";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  visiblePages = 5, // Número de páginas visibles por defecto
}) {
  const startPage = Math.max(2, currentPage - Math.floor(visiblePages / 2)); // Empieza desde la segunda página
  const endPage = Math.min(totalPages - 1, startPage + visiblePages - 1); // Termina antes de la última página

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className={styles.pagination}>
      {/* Flecha Izquierda */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.paginationButton}
      >
        ⬅
      </button>

      {/* Primera Página */}
      {currentPage > 1 && (
        <button
          onClick={() => goToPage(1)}
          className={`${styles.paginationButton} ${
            currentPage === 1 ? styles.activePage : ""
          }`}
        >
          1
        </button>
      )}

      {/* Elipsis al Inicio */}
      {startPage > 2 && <span className={styles.paginationEllipsis}>...</span>}

      {/* Números de Página Dinámicos */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`${styles.paginationButton} ${
            page === currentPage ? styles.activePage : ""
          }`}
        >
          {page}
        </button>
      ))}

      {/* Elipsis al Final */}
      {endPage < totalPages - 1 && (
        <span className={styles.paginationEllipsis}>...</span>
      )}

      {/* Última Página */}
      {currentPage < totalPages && (
        <button
          onClick={() => goToPage(totalPages)}
          className={`${styles.paginationButton} ${
            currentPage === totalPages ? styles.activePage : ""
          }`}
        >
          {totalPages}
        </button>
      )}

      {/* Flecha Derecha */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.paginationButton}
      >
        ➡
      </button>
    </div>
  );
}
