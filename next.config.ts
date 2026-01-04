import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 👉 Configuración principal
const nextConfig: NextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  images: {
    unoptimized: true,
  },
  eslint: {
    // 🚑 En producción no rompas el build por errores de ESLint
    ignoreDuringBuilds: true,
  },

  // ⚡️ Aquí añadimos las redirecciones permanentes
  async redirects() {
    return [
      {
        source: "/de/about/spenden", // la URL antigua
        destination: "/de/support/donations", // la URL nueva correcta
        permanent: true, // indica a Google que es un redirect 301 permanente
      },
    ];
  },
};

// 👉 Aplicar el plugin de next-intl
const withNextIntl = createNextIntlPlugin({
  // ya tienes definidos los locales en routing.ts
});

export default withNextIntl(nextConfig);
