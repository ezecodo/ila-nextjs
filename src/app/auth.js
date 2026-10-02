import NextAuth from "next-auth";
import authConfig from "@/auth.config.js";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";
import { signInSchema } from "@/lib/zod";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = signInSchema.parse(credentials);
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) throw new Error("Credenciales inválidas.");
          if (!user.emailVerified) {
            throw new Error(
              "Debes verificar tu email antes de iniciar sesión."
            );
          }
          const isValidPassword = await verifyPassword(password, user.password);
          if (!isValidPassword) throw new Error("Credenciales inválidas.");

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }; // ✅ Agregamos `role`
        } catch (error) {
          console.error("❌ Error en la autenticación:", error);
          throw new Error("Error de autenticación.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || user.sub || token.id; // 🔥 Usa sub si no hay id
        token.role = user.role || token.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id || token.sub || null; // 🔥 Asegura que el ID esté presente
        session.user.role = token.role;
      }
      return session;
    },
  },
});
