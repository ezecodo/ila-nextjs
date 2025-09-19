import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 👉 Configuración principal
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    // 🚑 En producción no rompas el build por errores de ESLint
    ignoreDuringBuilds: true,
  },
};

// 👉 Acá aplicamos el plugin de next-intl por fuera
const withNextIntl = createNextIntlPlugin({
  // Opcional: podrías definir locales acá, pero ya los tenés en `routing.ts`
});

export default withNextIntl(nextConfig);
