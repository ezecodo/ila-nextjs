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
  const [showAnimation, setShowAnimation] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Verificar si la animación ya se mostró en esta sesión
    const hasShownAnimation = sessionStorage.getItem("hasShownAnimation");

    if (hasShownAnimation) {
      setShowAnimation(false);
      setFadeIn(true); // Activa el contenido directamente
    } else {
      const timer = setTimeout(() => {
        setShowAnimation(false); // Ocultar animación después de 3 segundos
        setTimeout(() => setFadeIn(true), 100); // Añade un efecto de transición
        sessionStorage.setItem("hasShownAnimation", "true"); // Marca la animación como mostrada
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      {showAnimation && <LoadingScreen />}
      {!showAnimation && (
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
