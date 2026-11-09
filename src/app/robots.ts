import { MetadataRoute } from "next";

const baseUrl = "https://www.ila-web.de";
const locales = ["de", "es"];

// Solo se bloquean rutas privadas (con sesión → 401 o redirect al login).
// NO bloquear todo /api/: muchas páginas públicas son client components que
// cargan su contenido vía /api/... y Google necesita poder pedirlo para
// renderizarlas. Si se protege una ruta /api nueva, sumarla acá.
// Ojo con los prefijos: robots.txt matchea por prefijo — "/de/auth/" lleva
// barra final para no bloquear "/de/authors".
const privateApi = [
  "/api/admin/",
  "/api/auth/",
  "/api/user/",
  "/api/users",
  "/api/articles/favorites",
  "/api/globila/",
  "/api/orders",
  "/api/subscriptions",
  "/api/activity-log",
  "/api/dashboard/",
  "/api/analytics/",
];

const privatePages = locales.flatMap((locale) => [
  `/${locale}/dashboard`, // cubre también /dashboard-users
  `/${locale}/auth/`,
  `/${locale}/pdf-reader`,
]);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...privateApi, ...privatePages],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
