"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "@/components/LoadingScreen"; // Pantalla de carga
import Header from "@/components/Header"; // Encabezado
import Footer from "@/components/Footer"; // Pie de página
import SearchBar from "@/components/SearchBar"; // Barra de búsqueda

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setFadeIn(true), 100);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <LoadingScreen />}
      {!loading && (
        <div className={`page-content ${fadeIn ? "fade-in" : ""}`}>
          <Header />
          <SearchBar />
          <main>{children}</main>
          <Footer />
        </div>
      )}
    </>
  );
}
