"use client";

import Image from "next/image";

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="logo-animation">
        <Image
          src="/ila-logo.png" // Cambia esto si el logo está en otra ruta
          alt="ILA Logo"
          width={150}
          height={150}
          priority
          style={{
            borderRadius: "50%", // Hace que el logo sea redondo
            objectFit: "cover", // Ajusta el contenido dentro del contenedor
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
