import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// ✅ Inicializamos middlewares
const intlMiddleware = createMiddleware(routing);
export const { auth: middlewareAuth } = NextAuth(authConfig);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 🧱 Zonas del dashboard
  const isAdminArea =
    pathname.startsWith("/es/dashboard") ||
    pathname.startsWith("/de/dashboard");

  const isTranslatorArea =
    pathname.startsWith("/es/dashboard/translators") ||
    pathname.startsWith("/de/dashboard/translators");

  const isUserArea =
    pathname.startsWith("/es/dashboard-users") ||
    pathname.startsWith("/de/dashboard-users");

  const isProtectedRoute = isAdminArea || isTranslatorArea || isUserArea;

  // 🧩 Si la ruta está protegida
  if (isProtectedRoute) {
    const session = await middlewareAuth();

    // 🚫 No autenticado
    if (!session) {
      return NextResponse.redirect(
        new URL(`/${req.nextUrl.locale}/auth/signin`, req.url)
      );
    }

    const role = session.user?.role || "guest";

    // ✅ Admin accede a todo
    if (role === "admin") {
      return intlMiddleware(req);
    }

    // ✅ Translator solo a su zona
    if (role === "translator") {
      if (!isTranslatorArea) {
        console.warn(
          "🚫 Translator intentó acceder a zona restringida:",
          pathname
        );
        return NextResponse.redirect(
          new URL(`/${req.nextUrl.locale}/dashboard/translators`, req.url)
        );
      }
    }

    // ✅ User solo a dashboard-users
    if (role === "user") {
      if (!isUserArea) {
        console.warn(
          "🚫 User intentó acceder a dashboard restringido:",
          pathname
        );
        return NextResponse.redirect(
          new URL(`/${req.nextUrl.locale}/dashboard-users`, req.url)
        );
      }
    }
  }

  // 🌍 Pasar por middleware de internacionalización para todo lo demás
  return intlMiddleware(req);
}

// ✅ Evitar /api, _next, _vercel, archivos estáticos, etc.
export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
