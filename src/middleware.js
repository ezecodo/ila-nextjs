import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const intlMiddleware = createMiddleware(routing);

export const { auth: middlewareAuth } = NextAuth(authConfig);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

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

  return intlMiddleware(req);
}

// ✅ Matcher oficial: evita /api, /_next, archivos estáticos, etc.
export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
