import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 👉 Este es tu `nextConfig` actual
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

// 👉 Acá aplicamos el plugin de next-intl por fuera
const withNextIntl = createNextIntlPlugin({
  // Opcional: podrías definir locales acá, pero ya los tenés en `routing.ts`
});

export default withNextIntl(nextConfig);
