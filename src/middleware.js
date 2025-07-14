import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const intlMiddleware = createMiddleware(routing);
export const { auth: middlewareAuth } = NextAuth(authConfig);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 👮 Rutas protegidas (dashboard)
  const isProtectedRoute =
    pathname.startsWith("/es/dashboard") ||
    pathname.startsWith("/de/dashboard") ||
    pathname.startsWith("/es/dashboard-users") ||
    pathname.startsWith("/de/dashboard-users");

  if (isProtectedRoute) {
    const session = await middlewareAuth();
    if (!session) {
      return NextResponse.redirect(
        new URL(`/${req.nextUrl.locale}/auth/signin`, req.url)
      );
    }
  }

  // 🌐 Detectar si es una URL legacy sin prefijo de idioma
  const hasLocale = pathname.startsWith("/es") || pathname.startsWith("/de");
  const isLegacyPath = pathname.startsWith("/ausgaben/") && !hasLocale;

  if (isLegacyPath) {
    // Chequear si existe ese legacyPath en la base de datos
    try {
      const apiUrl = new URL(`/api/articles/by-legacy-path`, req.url);
      apiUrl.searchParams.set("path", pathname);

      const res = await fetch(apiUrl.toString());
      if (res.ok) {
        // Si existe, redirigimos a la versión con /de (por defecto)
        const locale = "de"; // o "es" si prefieres
        const rewriteUrl = new URL(`/${locale}${pathname}`, req.url);
        return NextResponse.rewrite(rewriteUrl);
      }
    } catch (err) {
      console.error("Error verificando legacyPath en middleware:", err);
    }
  }

  // 🌍 Pasar por middleware de internacionalización
  return intlMiddleware(req);
}

// ✅ Evita /api, /_next, /_vercel, etc.
export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
