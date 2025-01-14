import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true, // Desactiva el optimizador de imágenes
  },
};

export default nextConfig;
