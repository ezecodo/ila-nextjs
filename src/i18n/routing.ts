import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "es"], // He puesto 'de' primero por consistencia con el default
  defaultLocale: "de",
  localeDetection: false, // 👈 ESTO desactiva que el móvil decida por ti
});
