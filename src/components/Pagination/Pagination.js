import React from "react";
import styles from "./Pagination.module.css";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  visiblePages = 5, // Número de páginas visibles por defecto
}) {
  const startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  const endPage = Math.min(totalPages, startPage + visiblePages - 1);

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

      {/* Números de Página */}
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

      {/* Última Página */}
      {endPage < totalPages && (
        <>
          <span className={styles.paginationEllipsis}>...</span>
          <button
            onClick={() => goToPage(totalPages)}
            className={styles.paginationButton}
          >
            {totalPages}
          </button>
        </>
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
