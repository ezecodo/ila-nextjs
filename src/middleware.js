import NextAuth from "next-auth";
import authConfig from "@/auth.config"; // ✅ Importación correcta con alias `@`
import { NextResponse } from "next/server";

export const { auth: middlewareAuth } = NextAuth(authConfig);

export async function middleware(req) {
  console.log("🔥 Middleware ejecutándose en:", req.nextUrl.pathname);

  const session = await middlewareAuth();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
